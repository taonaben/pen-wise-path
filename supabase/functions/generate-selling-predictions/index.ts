import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth, requireFarmAccess } from "../_shared/auth.ts";
import { HttpError, toErrorResponse } from "../_shared/errors.ts";
import { getSupabaseClients } from "../_shared/supabaseAdmin.ts";
import { fetchPredictionData } from "./fetchData.ts";
import { generateAnimalPrediction } from "./predictionEngine.ts";
import {
  createPredictionRun,
  finishPredictionRun,
  insertPredictions,
  writePredictionAuditLog,
} from "./repositories.ts";
import { jsonResponse } from "./response.ts";
import type {
  AnySupabaseClient,
  GenerateSellingPredictionsPayload,
  GenerateSellingPredictionsResponse,
  ParsedPayload,
} from "./types.ts";

const defaultWindows = [0, 7, 14, 21, 30, 45, 60];

function parsePayload(payload: GenerateSellingPredictionsPayload): ParsedPayload {
  const farmId = payload.farm_id?.trim();
  const animalId = payload.animal_id?.trim();
  const mode = payload.mode;

  if (!farmId || !mode) {
    throw new HttpError("INVALID_PAYLOAD", "farm_id and mode are required", 400);
  }

  if (!["farm_scan", "single_animal"].includes(mode)) {
    throw new HttpError("INVALID_PAYLOAD", "mode is invalid", 400);
  }

  if (mode === "single_animal" && !animalId) {
    throw new HttpError("INVALID_PAYLOAD", "animal_id is required for single_animal mode", 400);
  }

  const windows = (payload.options?.windows?.length ? payload.options.windows : defaultWindows)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);

  if (windows.length === 0) {
    throw new HttpError("INVALID_PAYLOAD", "options.windows must include at least one non-negative number", 400);
  }

  const marketPriceMethod = payload.options?.market_price_method ?? "average_last_5";
  if (!["latest", "average_last_3", "average_last_5"].includes(marketPriceMethod)) {
    throw new HttpError("INVALID_PAYLOAD", "market_price_method is invalid", 400);
  }

  return {
    farmId,
    animalId,
    mode,
    windows,
    dryRun: Boolean(payload.options?.dry_run),
    marketPriceMethod,
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

  let predictionRunId: string | null = null;
  let adminClientForFailure: AnySupabaseClient | null = null;
  let dryRunForFailure = false;

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      throw new HttpError("UNAUTHORIZED", "Missing authorization header", 401);
    }

    const { callerClient, adminClient } = getSupabaseClients(authorization);
    adminClientForFailure = adminClient;
    const { userId } = await requireAuth(callerClient);
    const body = (await req.json()) as GenerateSellingPredictionsPayload;
    const parsed = parsePayload(body);
    dryRunForFailure = parsed.dryRun;

    await requireFarmAccess({
      adminClient,
      userId,
      farmId: parsed.farmId,
      mode: parsed.mode,
    });

    const startedAt = new Date().toISOString();
    const run = await createPredictionRun({
      adminClient,
      farmId: parsed.farmId,
      userId,
      mode: parsed.mode,
      windows: parsed.windows,
      marketPriceMethod: parsed.marketPriceMethod,
      dryRun: parsed.dryRun,
    });
    predictionRunId = run?.id ?? null;

    const data = await fetchPredictionData({
      adminClient,
      farmId: parsed.farmId,
      animalId: parsed.animalId,
    });

    const predictions = data.animals.map((animal) =>
      generateAnimalPrediction({
        farmId: parsed.farmId,
        animal,
        weights: data.weightsByAnimal.get(animal.id) ?? [],
        feedAllocations: data.feedByAnimal.get(animal.id) ?? [],
        marketPrices: data.marketPricesBySpecies.get(animal.species_id) ?? [],
        severeAlerts: data.alertsByAnimal.get(animal.id) ?? [],
        windows: parsed.windows,
        marketPriceMethod: parsed.marketPriceMethod,
      }),
    );

    await insertPredictions({
      adminClient,
      runId: predictionRunId,
      dryRun: parsed.dryRun,
      predictions,
    });

    const recommendedToSell = predictions.filter(
      (prediction) => prediction.recommendation === "SELL_NOW",
    ).length;
    const lowConfidenceCount = predictions.filter(
      (prediction) => prediction.confidence_label === "Low",
    ).length;
    const animalsNeedingInspection = predictions.filter(
      (prediction) => prediction.recommendation === "INSPECT_BEFORE_SELLING",
    ).length;

    await finishPredictionRun({
      adminClient,
      runId: predictionRunId,
      dryRun: parsed.dryRun,
      status: "completed",
      metadata: {
        windows: parsed.windows,
        market_price_method: parsed.marketPriceMethod,
        scanned_animals: data.animals.length,
        predictions_created: predictions.length,
        recommended_to_sell: recommendedToSell,
        low_confidence_count: lowConfidenceCount,
        animals_needing_inspection: animalsNeedingInspection,
      },
    });

    await writePredictionAuditLog({
      adminClient,
      farmId: parsed.farmId,
      userId,
      dryRun: parsed.dryRun,
      scannedAnimals: data.animals.length,
      predictionsCreated: predictions.length,
    });

    const response: GenerateSellingPredictionsResponse = {
      success: true,
      farm_id: parsed.farmId,
      mode: parsed.mode,
      prediction_run_id: predictionRunId,
      scanned_animals: data.animals.length,
      predictions_created: predictions.length,
      recommended_to_sell: recommendedToSell,
      low_confidence_count: lowConfidenceCount,
      animals_needing_inspection: animalsNeedingInspection,
      skipped_animals: [],
      run_started_at: startedAt,
      run_finished_at: new Date().toISOString(),
    };

    return jsonResponse(response);
  } catch (error) {
    if (adminClientForFailure && predictionRunId) {
      try {
        await finishPredictionRun({
          adminClient: adminClientForFailure,
          runId: predictionRunId,
          dryRun: dryRunForFailure,
          status: "failed",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      } catch (finishError) {
        console.error("Failed to update prediction run after error", finishError);
      }
    }

    const parsedError = toErrorResponse(error);
    return jsonResponse(parsedError.body, parsedError.status);
  }
});
