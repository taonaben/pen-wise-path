import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth, requireFarmAccess } from "../_shared/auth.ts";
import { HttpError, toErrorResponse } from "../_shared/errors.ts";
import { getSupabaseClients } from "../_shared/supabaseAdmin.ts";
import { detectGrowthAlerts } from "./alertRules.ts";
import { upsertGrowthAlerts, fetchExistingOpenAlerts } from "./alertRepository.ts";
import { writeScanAuditLog } from "./auditRepository.ts";
import { calculateAnimalGrowthMetrics } from "./growthMetrics.ts";
import { jsonResponse } from "./response.ts";
import type {
  AnimalRow,
  FeedAllocationRow,
  GenerateGrowthAlertsPayload,
  GenerateGrowthAlertsResponse,
  SpeciesRow,
  WeightRecordRow,
} from "./types.ts";

function parsePayload(payload: GenerateGrowthAlertsPayload) {
  const farmId = payload.farm_id?.trim();
  const animalId = payload.animal_id?.trim();
  const mode = payload.mode;

  if (!farmId || !mode) {
    throw new HttpError("INVALID_PAYLOAD", "farm_id and mode are required", 400);
  }

  if (!["single_animal", "farm_scan", "scheduled_scan"].includes(mode)) {
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
    regenerateExisting: Boolean(payload.options?.regenerate_existing),
    lookbackDays:
      payload.options?.lookback_days && payload.options.lookback_days > 0
        ? payload.options.lookback_days
        : 30,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
      },
      405,
    );
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      throw new HttpError("UNAUTHORIZED", "Missing authorization header", 401);
    }

    const { callerClient, adminClient } = getSupabaseClients(authorization);
    const { userId } = await requireAuth(callerClient);

    const body = (await req.json()) as GenerateGrowthAlertsPayload;
    const parsed = parsePayload(body);

    await requireFarmAccess({
      adminClient,
      userId,
      farmId: parsed.farmId,
      mode: parsed.mode,
    });

    const scanStartedAt = new Date().toISOString();

    let animalQuery = adminClient
      .from("animals")
      .select("id,farm_id,tag_number,species_id,status")
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

    const { data: speciesData, error: speciesError } = await adminClient
      .from("animal_species")
      .select("id,slug,name");
    if (speciesError) {
      throw new HttpError("SCAN_FAILED", speciesError.message, 500);
    }

    const speciesById = new Map(
      (speciesData ?? []).map((species) => [species.id, species as SpeciesRow]),
    );

    const oneYearAgo = new Date();
    oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 365);
    const oneYearAgoIso = oneYearAgo.toISOString().slice(0, 10);

    const { data: weightData, error: weightError } = await adminClient
      .from("weight_records")
      .select("animal_id,weight_kg,recorded_at")
      .eq("farm_id", parsed.farmId)
      .in("animal_id", animalIds.length > 0 ? animalIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("recorded_at", oneYearAgoIso)
      .order("recorded_at", { ascending: true });

    if (weightError) {
      throw new HttpError("SCAN_FAILED", weightError.message, 500);
    }

    const lookbackDate = new Date();
    lookbackDate.setUTCDate(lookbackDate.getUTCDate() - parsed.lookbackDays);
    const lookbackDateIso = lookbackDate.toISOString().slice(0, 10);

    const { data: feedData, error: feedError } = await adminClient
      .from("feeding_event_animals")
      .select(
        "animal_id,allocated_quantity_kg,allocated_cost,feeding_event:feeding_events(feeding_date)",
      )
      .eq("farm_id", parsed.farmId)
      .in("animal_id", animalIds.length > 0 ? animalIds : ["00000000-0000-0000-0000-000000000000"])
      .gte("feeding_event.feeding_date", lookbackDateIso);

    if (feedError) {
      throw new HttpError("SCAN_FAILED", feedError.message, 500);
    }

    const existingOpenAlerts = await fetchExistingOpenAlerts({
      adminClient,
      farmId: parsed.farmId,
      animalIds,
    });

    const weightsByAnimal = new Map<string, WeightRecordRow[]>();
    for (const row of (weightData ?? []) as WeightRecordRow[]) {
      const list = weightsByAnimal.get(row.animal_id) ?? [];
      list.push(row);
      weightsByAnimal.set(row.animal_id, list);
    }

    const feedByAnimal = new Map<string, FeedAllocationRow[]>();
    for (const row of (feedData ?? []) as FeedAllocationRow[]) {
      const list = feedByAnimal.get(row.animal_id) ?? [];
      list.push(row);
      feedByAnimal.set(row.animal_id, list);
    }

    let generatedAlerts = 0;
    let updatedAlerts = 0;
    let skippedAlerts = 0;

    const skippedAnimals: Array<{ animal_id: string; reason: string }> = [];
    const responseAlerts: GenerateGrowthAlertsResponse["alerts"] = [];

    for (const animal of animals) {
      const species = speciesById.get(animal.species_id);
      const speciesSlug = species?.slug ?? "cattle";

      const metrics = calculateAnimalGrowthMetrics({
        weightRecords: weightsByAnimal.get(animal.id) ?? [],
        feedAllocations: feedByAnimal.get(animal.id) ?? [],
        lookbackDays: parsed.lookbackDays,
      });

      const candidates = detectGrowthAlerts({
        speciesSlug,
        tagNumber: animal.tag_number,
        metrics,
      });

      if (candidates.length === 0) {
        skippedAnimals.push({
          animal_id: animal.id,
          reason: "No growth alerts triggered",
        });
        continue;
      }

      const persisted = await upsertGrowthAlerts({
        adminClient,
        dryRun: parsed.dryRun,
        regenerateExisting: parsed.regenerateExisting,
        farmId: parsed.farmId,
        animalId: animal.id,
        existingOpenAlerts,
        alerts: candidates,
      });

      generatedAlerts += persisted.generated;
      updatedAlerts += persisted.updated;
      skippedAlerts += persisted.skipped;

      for (const candidate of candidates) {
        responseAlerts.push({
          animal_id: animal.id,
          tag_number: animal.tag_number,
          alert_type: candidate.alert_type,
          severity: candidate.severity,
          title: candidate.title,
          message: candidate.message,
          actual_value: candidate.actual_value,
          expected_value: candidate.expected_value,
          confidence: candidate.confidence,
          source: candidate.source,
        });
      }
    }

    if (!parsed.dryRun) {
      await writeScanAuditLog({
        adminClient,
        dryRun: parsed.dryRun,
        farmId: parsed.farmId,
        userId,
        scannedAnimals: animals.length,
        generatedAlerts,
        updatedAlerts,
        skippedAlerts,
      });
    }

    const response: GenerateGrowthAlertsResponse = {
      success: true,
      farm_id: parsed.farmId,
      mode: parsed.mode,
      scanned_animals: animals.length,
      generated_alerts: generatedAlerts,
      updated_alerts: updatedAlerts,
      skipped_alerts: skippedAlerts,
      skipped_animals: skippedAnimals,
      alerts: responseAlerts,
      scan_started_at: scanStartedAt,
      scan_finished_at: new Date().toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    const parsedError = toErrorResponse(error);
    return jsonResponse(parsedError.body, parsedError.status);
  }
});
