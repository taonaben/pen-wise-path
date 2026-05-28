export type GenerateGrowthAlertsMode = "single_animal" | "farm_scan" | "scheduled_scan";

export type GenerateGrowthAlertsPayload = {
  farm_id?: string;
  animal_id?: string;
  mode?: GenerateGrowthAlertsMode;
  options?: {
    dry_run?: boolean;
    lookback_days?: number;
    regenerate_existing?: boolean;
  };
};

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertSource = "rule_based" | "statistical" | "ml_model" | "manual";

export type AlertStatus = "open" | "reviewing" | "resolved" | "dismissed";

export type GrowthAlertResult = {
  animal_id: string;
  tag_number: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  actual_value?: number;
  expected_value?: number;
  confidence: number;
  source: Exclude<AlertSource, "manual">;
};

export type GenerateGrowthAlertsResponse = {
  success: boolean;
  farm_id: string;
  mode: GenerateGrowthAlertsMode;
  scanned_animals: number;
  generated_alerts: number;
  updated_alerts: number;
  skipped_alerts: number;
  skipped_animals: Array<{ animal_id: string; reason: string }>;
  alerts: GrowthAlertResult[];
  scan_started_at: string;
  scan_finished_at: string;
};

export type AnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  species_id: string;
  status: string;
};

export type SpeciesRow = {
  id: string;
  slug: string;
  name: string;
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

export type ExistingAlertRow = {
  id: string;
  farm_id: string;
  animal_id: string | null;
  alert_type: string;
  status: AlertStatus;
  metadata: Record<string, unknown> | null;
};

export type AnimalGrowthMetrics = {
  latestWeightKg: number | null;
  previousWeightKg: number | null;
  recentAdgKgPerDay: number | null;
  daysSinceLatestWeight: number | null;
  totalFeedQuantityKg: number;
  totalFeedCost: number;
};

export type CandidateAlert = {
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  detected_metric: string;
  actual_value?: number;
  expected_value?: number;
  confidence: number;
  source: "rule_based" | "statistical" | "ml_model";
};
