import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type {
  GenerateSellingPredictionsPayload,
  GenerateSellingPredictionsResponse,
  MarkSoldPayload,
  PredictionRunViewModel,
  PredictionWindowViewModel,
  SellingPredictionViewModel,
  SellingPredictionsResult,
} from "../types/sellingPrediction.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type PredictionRunRow = {
  id: string;
  farm_id: string;
  run_type: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  finished_at: string | null;
  engine_version: string;
  metadata: Record<string, unknown> | null;
};

type SellingPredictionRow = {
  id: string;
  farm_id: string;
  prediction_run_id: string;
  animal_id: string;
  species_id: string | null;
  current_weight_kg: number | string | null;
  average_daily_gain_kg: number | string | null;
  current_market_price: number | string | null;
  best_window_days: number;
  best_sell_date: string | null;
  predicted_weight_kg: number | string | null;
  expected_revenue: number | string | null;
  expected_total_cost: number | string | null;
  expected_profit: number | string | null;
  recommendation: SellingPredictionViewModel["recommendation"];
  confidence_score: number | string;
  confidence_label: SellingPredictionViewModel["confidenceLabel"];
  explanation: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  animal?: { id: string; tag_number: string; status: string | null } | null;
  species?: { id: string; name: string; slug: string } | null;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapRun(row: PredictionRunRow): PredictionRunViewModel {
  return {
    id: row.id,
    farmId: row.farm_id,
    runType: row.run_type,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    engineVersion: row.engine_version,
    metadata: row.metadata ?? {},
  };
}

function mapPrediction(row: SellingPredictionRow): SellingPredictionViewModel {
  const metadata = row.metadata ?? {};
  const windows = Array.isArray(metadata.windows)
    ? (metadata.windows as PredictionWindowViewModel[])
    : [];

  return {
    id: row.id,
    farmId: row.farm_id,
    predictionRunId: row.prediction_run_id,
    animalId: row.animal_id,
    tagNumber: row.animal?.tag_number ?? "Unknown animal",
    animalStatus: row.animal?.status ?? null,
    speciesId: row.species_id,
    speciesName: row.species?.name ?? "Unspecified",
    currentWeightKg: toNumber(row.current_weight_kg),
    averageDailyGainKg: toNumber(row.average_daily_gain_kg),
    currentMarketPrice: toNumber(row.current_market_price),
    bestWindowDays: row.best_window_days,
    bestSellDate: row.best_sell_date,
    predictedWeightKg: toNumber(row.predicted_weight_kg),
    expectedRevenue: toNumber(row.expected_revenue),
    expectedTotalCost: toNumber(row.expected_total_cost),
    expectedProfit: toNumber(row.expected_profit),
    recommendation: row.recommendation,
    confidenceScore: toNumber(row.confidence_score) ?? 0,
    confidenceLabel: row.confidence_label,
    explanation: row.explanation,
    windows,
    metadata,
    createdAt: row.created_at,
  };
}

async function getLatestRun(farmId: string): Promise<PredictionRunViewModel | null> {
  const { data, error } = await db
    .from("prediction_runs")
    .select("*")
    .eq("farm_id", farmId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) handleSupabaseError(error);
  return data ? mapRun(data as PredictionRunRow) : null;
}

export const sellingPredictionApi = {
  async invokePredictionRun(
    payload: GenerateSellingPredictionsPayload,
  ): Promise<GenerateSellingPredictionsResponse> {
    const { data, error } = await supabase.functions.invoke("generate-selling-predictions", {
      body: payload,
    });

    if (error) handleSupabaseError(error);
    return data as GenerateSellingPredictionsResponse;
  },

  async getSellingPredictions(farmId: string): Promise<SellingPredictionsResult> {
    const latestRun = await getLatestRun(farmId);
    if (!latestRun) return { latestRun: null, predictions: [] };

    const { data, error } = await db
      .from("selling_predictions")
      .select(
        `
          *,
          animal:animals(id, tag_number, status),
          species:animal_species(id, name, slug)
        `,
      )
      .eq("farm_id", farmId)
      .eq("prediction_run_id", latestRun.id)
      .order("expected_profit", { ascending: false });

    if (error) handleSupabaseError(error);

    return {
      latestRun,
      predictions: ((data ?? []) as SellingPredictionRow[]).map(mapPrediction),
    };
  },

  async getSellingPredictionByAnimal(
    farmId: string,
    animalId: string,
  ): Promise<SellingPredictionViewModel | null> {
    const latestRun = await getLatestRun(farmId);
    if (!latestRun) return null;

    const { data, error } = await db
      .from("selling_predictions")
      .select("*, animal:animals(id, tag_number, status), species:animal_species(id, name, slug)")
      .eq("farm_id", farmId)
      .eq("prediction_run_id", latestRun.id)
      .eq("animal_id", animalId)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? mapPrediction(data as SellingPredictionRow) : null;
  },

  async markAnimalAsSoldFromPrediction(payload: MarkSoldPayload) {
    if (!(payload.saleWeightKg > 0)) throw new Error("Sale weight must be greater than 0");
    if (!(payload.pricePerKg > 0)) throw new Error("Price per kg must be greater than 0");
    if (!payload.soldAt) throw new Error("Sold date is required");

    const { data, error } = await supabase.functions.invoke("record-animal-sale", {
      body: {
        action: "create",
        farm_id: payload.farmId,
        animal_id: payload.animalId,
        sale_weight_kg: payload.saleWeightKg,
        price_per_kg: payload.pricePerKg,
        price_basis: "live_weight",
        currency: "USD",
        sold_at: payload.soldAt,
        buyer_name: payload.buyerName?.trim() || null,
        notes: payload.notes?.trim() || null,
        prediction_id: payload.predictionId,
        payment_status: "paid",
        create_market_price: false,
      },
    });

    if (error) handleSupabaseError(error);
    return data;
  },
};
