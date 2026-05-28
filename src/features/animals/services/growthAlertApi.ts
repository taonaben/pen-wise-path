import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type GenerateGrowthAlertsMode = "single_animal" | "farm_scan" | "scheduled_scan";

export type GenerateGrowthAlertsPayload = {
  farm_id: string;
  animal_id?: string;
  mode: GenerateGrowthAlertsMode;
  options?: {
    dry_run?: boolean;
    lookback_days?: number;
    regenerate_existing?: boolean;
  };
};

export type GrowthAlertResult = {
  animal_id: string;
  tag_number: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  actual_value?: number;
  expected_value?: number;
  confidence: number;
  source: "rule_based" | "statistical" | "ml_model";
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

export type GrowthAlert = {
  id: string;
  farm_id: string;
  animal_id: string | null;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  detected_metric: string | null;
  expected_value: number | null;
  actual_value: number | null;
  confidence: number | null;
  source: "rule_based" | "statistical" | "ml_model" | "manual";
  engine_version: string | null;
  last_detected_at: string | null;
  created_at: string;
};

const GROWTH_ALERT_TYPES = ["MISSING_WEIGHT_RECORD", "NEGATIVE_GAIN", "LOW_ADG"];

export const growthAlertApi = {
  async invokeGenerateGrowthAlerts(
    payload: GenerateGrowthAlertsPayload,
  ): Promise<GenerateGrowthAlertsResponse> {
    const { data, error } = await supabase.functions.invoke("generate-growth-alerts", {
      body: payload,
    });

    if (error) handleSupabaseError(error);
    return data as GenerateGrowthAlertsResponse;
  },

  async generateFarmAlerts(
    farmId: string,
    options?: GenerateGrowthAlertsPayload["options"],
  ): Promise<GenerateGrowthAlertsResponse> {
    return this.invokeGenerateGrowthAlerts({
      farm_id: farmId,
      mode: "farm_scan",
      options,
    });
  },

  async generateAnimalAlerts(
    farmId: string,
    animalId: string,
    options?: GenerateGrowthAlertsPayload["options"],
  ): Promise<GenerateGrowthAlertsResponse> {
    return this.invokeGenerateGrowthAlerts({
      farm_id: farmId,
      animal_id: animalId,
      mode: "single_animal",
      options,
    });
  },

  async getGrowthAlerts(farmId: string): Promise<GrowthAlert[]> {
    const { data, error } = await db
      .from("alerts")
      .select("*")
      .eq("farm_id", farmId)
      .in("alert_type", GROWTH_ALERT_TYPES)
      .order("last_detected_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as GrowthAlert[];
  },
};
