import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";
import type { AssessmentResult, GenerateHealthAssessmentsMode } from "./types.ts";

export async function createAssessmentRun(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  farmId: string;
  userId: string;
  mode: GenerateHealthAssessmentsMode;
}) {
  if (args.dryRun) return null;

  const { data, error } = await args.adminClient
    .from("health_assessment_runs")
    .insert({
      farm_id: args.farmId,
      run_type: args.mode === "single_animal" ? "single_animal" : "manual",
      status: "running",
      created_by: args.userId,
      engine_version: "health-assessment-v1",
      metadata: {
        mode: args.mode,
      },
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function insertAssessments(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  farmId: string;
  runId: string | null;
  assessments: AssessmentResult[];
}) {
  if (args.dryRun || !args.runId || args.assessments.length === 0) return;

  const rows = args.assessments.map((assessment) => ({
    farm_id: args.farmId,
    assessment_run_id: args.runId,
    animal_id: assessment.animal_id,
    health_status: assessment.health_status,
    health_score: assessment.health_score,
    risk_level: assessment.risk_level,
    confidence_score: assessment.confidence_score,
    confidence_label: assessment.confidence_label,
    summary: assessment.summary,
    recommended_action: assessment.recommended_action,
    source: assessment.source,
    engine_version: assessment.engine_version,
    signals: assessment.signals,
  }));

  const { error } = await args.adminClient.from("health_assessments").insert(rows);
  if (error) throw error;
}

export async function finishAssessmentRun(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  runId: string | null;
  status: "completed" | "failed";
  metadata: Record<string, unknown>;
}) {
  if (args.dryRun || !args.runId) return;

  const { error } = await args.adminClient
    .from("health_assessment_runs")
    .update({
      status: args.status,
      finished_at: new Date().toISOString(),
      metadata: args.metadata,
    })
    .eq("id", args.runId);

  if (error) throw error;
}
