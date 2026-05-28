import { HttpError } from "../_shared/errors.ts";
import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";
import type {
  AnimalPredictionResult,
  GenerateSellingPredictionsMode,
  MarketPriceMethod,
  PredictionRunRow,
} from "./types.ts";

export async function createPredictionRun(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  userId: string;
  mode: GenerateSellingPredictionsMode;
  windows: number[];
  marketPriceMethod: MarketPriceMethod;
  dryRun: boolean;
}): Promise<PredictionRunRow | null> {
  if (args.dryRun) return null;

  const { data, error } = await args.adminClient
    .from("prediction_runs")
    .insert({
      farm_id: args.farmId,
      run_type: args.mode === "single_animal" ? "single_animal" : "manual",
      status: "running",
      created_by: args.userId,
      engine_version: "selling-predictions-v1",
      metadata: {
        windows: args.windows,
        market_price_method: args.marketPriceMethod,
      },
    })
    .select("*")
    .single();

  if (error) throw new HttpError("PREDICTION_FAILED", error.message, 500);
  return data as PredictionRunRow;
}

export async function insertPredictions(args: {
  adminClient: AnySupabaseClient;
  runId: string | null;
  dryRun: boolean;
  predictions: AnimalPredictionResult[];
}) {
  if (args.dryRun || !args.runId || args.predictions.length === 0) return;

  const { error } = await args.adminClient.from("selling_predictions").insert(
    args.predictions.map((prediction) => ({
      farm_id: prediction.farm_id,
      prediction_run_id: args.runId,
      animal_id: prediction.animal_id,
      species_id: prediction.species_id,
      current_weight_kg: prediction.current_weight_kg,
      average_daily_gain_kg: prediction.average_daily_gain_kg,
      current_market_price: prediction.current_market_price,
      best_window_days: prediction.best_window_days,
      best_sell_date: prediction.best_sell_date,
      predicted_weight_kg: prediction.predicted_weight_kg,
      expected_revenue: prediction.expected_revenue,
      expected_total_cost: prediction.expected_total_cost,
      expected_profit: prediction.expected_profit,
      recommendation: prediction.recommendation,
      confidence_score: prediction.confidence_score,
      confidence_label: prediction.confidence_label,
      explanation: prediction.explanation,
      metadata: prediction.metadata,
    })),
  );

  if (error) throw new HttpError("PREDICTION_FAILED", error.message, 500);
}

export async function finishPredictionRun(args: {
  adminClient: AnySupabaseClient;
  runId: string | null;
  dryRun: boolean;
  status: "completed" | "failed";
  metadata?: Record<string, unknown>;
}) {
  if (args.dryRun || !args.runId) return;

  const { error } = await args.adminClient
    .from("prediction_runs")
    .update({
      status: args.status,
      finished_at: new Date().toISOString(),
      metadata: args.metadata ?? {},
    })
    .eq("id", args.runId);

  if (error) throw new HttpError("PREDICTION_FAILED", error.message, 500);
}

export async function writePredictionAuditLog(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  userId: string;
  dryRun: boolean;
  scannedAnimals: number;
  predictionsCreated: number;
}) {
  if (args.dryRun) return;

  const { error } = await args.adminClient.from("audit_logs").insert({
    farm_id: args.farmId,
    user_id: args.userId,
    action: "SELLING_PREDICTIONS_GENERATED",
    entity_type: "prediction_run",
    description: `Generated ${args.predictionsCreated} selling predictions across ${args.scannedAnimals} animals.`,
    metadata: {
      scanned_animals: args.scannedAnimals,
      predictions_created: args.predictionsCreated,
    },
  });

  if (error) throw new HttpError("PREDICTION_FAILED", error.message, 500);
}
