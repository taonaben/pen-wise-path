import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { HealthAssessment } from "../types/animal.types";

export type GenerateHealthAssessmentsMode = "single_animal" | "farm_scan";

export type GenerateHealthAssessmentsPayload = {
  farm_id: string;
  animal_id?: string;
  mode: GenerateHealthAssessmentsMode;
  options?: {
    dry_run?: boolean;
    lookback_days?: number;
  };
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
  assessments: Array<
    Pick<
      HealthAssessment,
      | "animal_id"
      | "health_status"
      | "health_score"
      | "risk_level"
      | "confidence_score"
      | "confidence_label"
      | "summary"
      | "recommended_action"
      | "source"
      | "engine_version"
      | "signals"
    > & { tag_number: string }
  >;
  scan_started_at: string;
  scan_finished_at: string;
};

export const healthAssessmentApi = {
  async invokeGenerateHealthAssessments(
    payload: GenerateHealthAssessmentsPayload,
  ): Promise<GenerateHealthAssessmentsResponse> {
    const { data, error } = await supabase.functions.invoke("generate-health-assessments", {
      body: payload,
    });

    if (error) handleSupabaseError(error);
    return data as GenerateHealthAssessmentsResponse;
  },
};
