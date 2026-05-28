export type GenerateSellingPredictionsMode = "farm_scan" | "single_animal";
export type MarketPriceMethod = "latest" | "average_last_3" | "average_last_5";
export type Recommendation =
  | "SELL_NOW"
  | "HOLD"
  | "WATCH"
  | "INSPECT_BEFORE_SELLING"
  | "NOT_READY";
export type ConfidenceLabel = "High" | "Medium" | "Low";

export type GenerateSellingPredictionsPayload = {
  farm_id?: string;
  animal_id?: string;
  mode?: GenerateSellingPredictionsMode;
  options?: {
    windows?: number[];
    dry_run?: boolean;
    market_price_method?: MarketPriceMethod;
  };
};

export type ParsedPayload = {
  farmId: string;
  animalId?: string;
  mode: GenerateSellingPredictionsMode;
  windows: number[];
  dryRun: boolean;
  marketPriceMethod: MarketPriceMethod;
};

export type GenerateSellingPredictionsResponse = {
  success: boolean;
  farm_id: string;
  mode: GenerateSellingPredictionsMode;
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

export type SpeciesRow = {
  id: string;
  slug: string;
  name: string;
};

export type AnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  species_id: string;
  purchase_weight_kg: number | string;
  purchase_price: number | string;
  purchase_date: string;
  status: string;
  species?: SpeciesRow | null;
};

export type WeightRecordRow = {
  animal_id: string;
  weight_kg: number | string;
  recorded_at: string;
};

export type FeedAllocationRow = {
  animal_id: string;
  allocated_quantity_kg: number | string;
  allocated_cost: number | string;
  feeding_event: {
    feeding_date: string;
  } | null;
};

export type MarketPriceRow = {
  species_id: string;
  price_per_kg: number | string;
  recorded_at: string;
  currency: string | null;
  price_basis: string | null;
};

export type AlertRow = {
  animal_id: string | null;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: string | null;
};

export type PredictionData = {
  animals: AnimalRow[];
  weightsByAnimal: Map<string, WeightRecordRow[]>;
  feedByAnimal: Map<string, FeedAllocationRow[]>;
  marketPricesBySpecies: Map<string, MarketPriceRow[]>;
  alertsByAnimal: Map<string, AlertRow[]>;
};

export type PredictionWindow = {
  days: number;
  predicted_weight: number;
  predicted_price: number | null;
  future_feed_cost: number;
  expected_revenue: number | null;
  expected_total_cost: number;
  expected_profit: number | null;
  profit_change: number | null;
};

export type ConfidenceResult = {
  score: number;
  label: ConfidenceLabel;
  reasons: string[];
};

export type AnimalPredictionResult = {
  farm_id: string;
  animal_id: string;
  species_id: string | null;
  tag_number: string;
  current_weight_kg: number | null;
  average_daily_gain_kg: number | null;
  current_market_price: number | null;
  best_window_days: number;
  best_sell_date: string;
  predicted_weight_kg: number | null;
  expected_revenue: number | null;
  expected_total_cost: number | null;
  expected_profit: number | null;
  recommendation: Recommendation;
  confidence_score: number;
  confidence_label: ConfidenceLabel;
  explanation: string;
  metadata: Record<string, unknown>;
};

export type PredictionRunRow = {
  id: string;
  farm_id: string;
  run_type: string;
  status: string;
  started_at: string;
  finished_at: string | null;
};
