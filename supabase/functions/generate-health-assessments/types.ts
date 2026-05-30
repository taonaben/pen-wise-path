export type GenerateHealthAssessmentsMode = "single_animal" | "farm_scan";

export type GenerateHealthAssessmentsPayload = {
  farm_id?: string;
  animal_id?: string;
  mode?: GenerateHealthAssessmentsMode;
  options?: {
    dry_run?: boolean;
    lookback_days?: number;
  };
};

export type AnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  species_id: string | null;
  purchase_weight_kg: number | string;
  status: string;
  species?: {
    slug: string;
    name: string;
  } | null;
};

export type WeightRecordRow = {
  animal_id: string;
  weight_kg: number | string;
  recorded_at: string;
};

export type FeedAllocationRow = {
  animal_id: string;
  allocated_quantity_kg: number | string;
  feeding_event: {
    feeding_date: string;
  } | null;
};

export type HealthEventRow = {
  animal_id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "monitoring" | "under_treatment" | "recovering" | "resolved";
  observed_at: string | null;
  event_date: string;
  treatment: string | null;
  treatment_given: string | null;
};

export type AlertRow = {
  animal_id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "reviewing" | "resolved" | "dismissed";
};

export type HealthStatus = "healthy" | "watch" | "at_risk" | "critical";

export type ConfidenceLabel = "High" | "Medium" | "Low";

export type AssessmentResult = {
  animal_id: string;
  tag_number: string;
  health_status: HealthStatus;
  health_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  confidence_score: number;
  confidence_label: ConfidenceLabel;
  summary: string;
  recommended_action: string;
  source: "rule_based";
  engine_version: "health-assessment-v1";
  signals: Record<string, unknown>;
};

export type GenerateHealthAssessmentsResponse = {
  success: boolean;
  farm_id: string;
  mode: GenerateHealthAssessmentsMode;
  scanned_animals: number;
  healthy: number;
  watch: number;
  at_risk: number;
  critical: number;
  skipped_animals: Array<{ animal_id: string; reason: string }>;
  assessments: AssessmentResult[];
  scan_started_at: string;
  scan_finished_at: string;
};
