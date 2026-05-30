import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth, requireFarmAccess } from "../_shared/auth.ts";
import { HttpError, toErrorResponse } from "../_shared/errors.ts";
import { getSupabaseClients } from "../_shared/supabaseAdmin.ts";
import { writeAssessmentAuditLog } from "./auditRepository.ts";
import { generateAnimalHealthAssessment } from "./assessmentEngine.ts";
import { createAssessmentRun, finishAssessmentRun, insertAssessments } from "./repositories.ts";
import { jsonResponse } from "./response.ts";
import type {
  AlertRow,
  AnimalRow,
  FeedAllocationRow,
  GenerateHealthAssessmentsPayload,
  GenerateHealthAssessmentsResponse,
  HealthEventRow,
  WeightRecordRow,
} from "./types.ts";

function parsePayload(payload: GenerateHealthAssessmentsPayload) {
  const farmId = payload.farm_id?.trim();
  const animalId = payload.animal_id?.trim();
  const mode = payload.mode;

  if (!farmId || !mode) {
    throw new HttpError("INVALID_PAYLOAD", "farm_id and mode are required", 400);
  }

  if (!["single_animal", "farm_scan"].includes(mode)) {
    throw new HttpError("INVALID_PAYLOAD", "mode is invalid", 400);
  }

  if (mode === "single_animal" && !animalId) {
    throw new HttpError("INVALID_PAYLOAD", "animal_id is required for single_animal mode", 400);
  }

  return {
    farmId,
    animalId,
    mode,
    dryRun: Boolean(payload.options?.dry_run),
    lookbackDays:
      payload.options?.lookback_days && payload.options.lookback_days > 0
        ? payload.options.lookback_days
        : 30,
  };
}

function groupBy<T>(rows: T[], keyFn: (row: T) => string | null): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;

    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return grouped;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
        },
      },
      405,
    );
  }

  let runId: string | null = null;

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      throw new HttpError("UNAUTHORIZED", "Missing authorization header", 401);
    }

    const { callerClient, adminClient } = getSupabaseClients(authorization);
    const { userId } = await requireAuth(callerClient);

    const body = (await req.json()) as GenerateHealthAssessmentsPayload;
    const parsed = parsePayload(body);

    await requireFarmAccess({
      adminClient,
      userId,
      farmId: parsed.farmId,
      mode: parsed.mode,
    });

    const scanStartedAt = new Date().toISOString();
    const todayIso = new Date().toISOString().slice(0, 10);

    let animalQuery = adminClient
      .from("animals")
      .select(
        "id,farm_id,tag_number,species_id,purchase_weight_kg,status,species:animal_species!animals_species_id_fkey(slug,name)",
      )
      .eq("farm_id", parsed.farmId)
      .eq("status", "active");

    if (parsed.animalId) {
      animalQuery = animalQuery.eq("id", parsed.animalId);
    }

    const { data: animalData, error: animalError } = await animalQuery;
    if (animalError) {
      throw new HttpError("SCAN_FAILED", animalError.message, 500);
    }

    const animals = (animalData ?? []) as AnimalRow[];
    if (parsed.mode === "single_animal" && animals.length === 0) {
      throw new HttpError("ANIMAL_NOT_FOUND", "Animal does not exist in this farm", 404);
    }

    const animalIds = animals.map((animal) => animal.id);
    const idsForQuery = animalIds.length > 0 ? animalIds : ["00000000-0000-0000-0000-000000000000"];

    const lookbackDate = new Date();
    lookbackDate.setUTCDate(lookbackDate.getUTCDate() - parsed.lookbackDays);
    const lookbackDateIso = lookbackDate.toISOString().slice(0, 10);

    const [
      { data: weightData, error: weightError },
      { data: feedData, error: feedError },
      { data: healthEventData, error: healthEventError },
      { data: alertData, error: alertError },
    ] = await Promise.all([
      adminClient
        .from("weight_records")
        .select("animal_id,weight_kg,recorded_at")
        .eq("farm_id", parsed.farmId)
        .in("animal_id", idsForQuery)
        .order("recorded_at", { ascending: true }),
      adminClient
        .from("feeding_event_animals")
        .select("animal_id,allocated_quantity_kg,feeding_event:feeding_events(feeding_date)")
        .eq("farm_id", parsed.farmId)
        .in("animal_id", idsForQuery)
        .gte("feeding_event.feeding_date", lookbackDateIso),
      adminClient
        .from("health_events")
        .select(
          "animal_id,event_type,severity,status,observed_at,event_date,treatment,treatment_given",
        )
        .eq("farm_id", parsed.farmId)
        .in("animal_id", idsForQuery)
        .order("observed_at", { ascending: false }),
      adminClient
        .from("alerts")
        .select("animal_id,alert_type,severity,status")
        .eq("farm_id", parsed.farmId)
        .in("animal_id", idsForQuery)
        .in("status", ["open", "reviewing"]),
    ]);

    if (weightError) throw new HttpError("SCAN_FAILED", weightError.message, 500);
    if (feedError) throw new HttpError("SCAN_FAILED", feedError.message, 500);
    if (healthEventError) throw new HttpError("SCAN_FAILED", healthEventError.message, 500);
    if (alertError) throw new HttpError("SCAN_FAILED", alertError.message, 500);

    const weightsByAnimal = groupBy(
      (weightData ?? []) as WeightRecordRow[],
      (row) => row.animal_id,
    );
    const feedByAnimal = groupBy((feedData ?? []) as FeedAllocationRow[], (row) => row.animal_id);
    const healthEventsByAnimal = groupBy(
      (healthEventData ?? []) as HealthEventRow[],
      (row) => row.animal_id,
    );
    const alertsByAnimal = groupBy((alertData ?? []) as AlertRow[], (row) => row.animal_id);

    runId = await createAssessmentRun({
      adminClient,
      dryRun: parsed.dryRun,
      farmId: parsed.farmId,
      userId,
      mode: parsed.mode,
    });

    const skippedAnimals: Array<{ animal_id: string; reason: string }> = [];
    const assessments = animals.map((animal) => {
      const weightRecords = weightsByAnimal.get(animal.id) ?? [];
      const feedAllocations = feedByAnimal.get(animal.id) ?? [];
      const healthEvents = healthEventsByAnimal.get(animal.id) ?? [];
      const alerts = alertsByAnimal.get(animal.id) ?? [];

      if (weightRecords.length === 0 && feedAllocations.length === 0 && healthEvents.length === 0) {
        skippedAnimals.push({
          animal_id: animal.id,
          reason: "No health, weight, or feed records found",
        });
      }

      return generateAnimalHealthAssessment({
        animal,
        weightRecords,
        feedAllocations,
        healthEvents,
        alerts,
        todayIso,
      });
    });

    await insertAssessments({
      adminClient,
      dryRun: parsed.dryRun,
      farmId: parsed.farmId,
      runId,
      assessments,
    });

    const statusSummary = {
      healthy: assessments.filter((assessment) => assessment.health_status === "healthy").length,
      watch: assessments.filter((assessment) => assessment.health_status === "watch").length,
      at_risk: assessments.filter((assessment) => assessment.health_status === "at_risk").length,
      critical: assessments.filter((assessment) => assessment.health_status === "critical").length,
    };

    await finishAssessmentRun({
      adminClient,
      dryRun: parsed.dryRun,
      runId,
      status: "completed",
      metadata: {
        mode: parsed.mode,
        scanned_animals: animals.length,
        ...statusSummary,
      },
    });

    await writeAssessmentAuditLog({
      adminClient,
      dryRun: parsed.dryRun,
      farmId: parsed.farmId,
      userId,
      scannedAnimals: animals.length,
      summary: statusSummary,
    });

    const response: GenerateHealthAssessmentsResponse = {
      success: true,
      farm_id: parsed.farmId,
      mode: parsed.mode,
      scanned_animals: animals.length,
      ...statusSummary,
      skipped_animals: skippedAnimals,
      assessments,
      scan_started_at: scanStartedAt,
      scan_finished_at: new Date().toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    const parsedError = toErrorResponse(error);

    if (runId) {
      const authorization = req.headers.get("Authorization");
      if (authorization) {
        try {
          const { adminClient } = getSupabaseClients(authorization);
          await finishAssessmentRun({
            adminClient,
            dryRun: false,
            runId,
            status: "failed",
            metadata: {
              error: parsedError.body.error,
            },
          });
        } catch {
          // ignore secondary failure while returning original error
        }
      }
    }

    return jsonResponse(parsedError.body, parsedError.status);
  }
});
