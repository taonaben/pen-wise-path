export type SellingRecommendation =
  | "SELL_NOW"
  | "HOLD"
  | "WATCH"
  | "INSPECT_BEFORE_SELLING"
  | "NOT_READY";

export type ConfidenceLabel = "High" | "Medium" | "Low";

export type PredictionWindowViewModel = {
  days: number;
  predicted_weight: number;
  predicted_price: number | null;
  future_feed_cost: number;
  expected_revenue: number | null;
  expected_total_cost: number;
  expected_profit: number | null;
  profit_change: number | null;
};

export type PredictionRunViewModel = {
  id: string;
  farmId: string;
  runType: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  engineVersion: string;
  metadata: Record<string, unknown>;
};

export type SellingPredictionViewModel = {
  id: string;
  farmId: string;
  predictionRunId: string;
  animalId: string;
  tagNumber: string;
  animalStatus: string | null;
  speciesId: string | null;
  speciesName: string;
  currentWeightKg: number | null;
  averageDailyGainKg: number | null;
  currentMarketPrice: number | null;
  bestWindowDays: number;
  bestSellDate: string | null;
  predictedWeightKg: number | null;
  expectedRevenue: number | null;
  expectedTotalCost: number | null;
  expectedProfit: number | null;
  recommendation: SellingRecommendation;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  explanation: string;
  windows: PredictionWindowViewModel[];
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SellingPredictionsResult = {
  latestRun: PredictionRunViewModel | null;
  predictions: SellingPredictionViewModel[];
};

export type GenerateSellingPredictionsPayload = {
  farm_id: string;
  animal_id?: string;
  mode: "farm_scan" | "single_animal";
  options?: {
    windows?: number[];
    dry_run?: boolean;
    market_price_method?: "latest" | "average_last_3" | "average_last_5";
  };
};

export type GenerateSellingPredictionsResponse = {
  success: boolean;
  farm_id: string;
  mode: "farm_scan" | "single_animal";
  prediction_run_id: string | null;
  scanned_animals: number;
  predictions_created: number;
  recommended_to_sell: number;
  low_confidence_count: number;
  animals_needing_inspection: number;
  skipped_animals: Array<{ animal_id: string; reason: string }>;
  run_started_at: string;
  run_finished_at: string;
};

export type MarkSoldPayload = {
  farmId: string;
  animalId: string;
  predictionId: string;
  saleWeightKg: number;
  pricePerKg: number;
  soldAt: string;
  buyerName?: string | null;
  notes?: string | null;
};
