import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";

export async function writeAssessmentAuditLog(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  farmId: string;
  userId: string;
  scannedAnimals: number;
  summary: {
    healthy: number;
    watch: number;
    at_risk: number;
    critical: number;
  };
}) {
  if (args.dryRun) return;

  await args.adminClient.from("audit_logs").insert({
    farm_id: args.farmId,
    user_id: args.userId,
    action: "HEALTH_ASSESSMENT_RUN",
    entity_type: "health_assessment_run",
    description: `Health assessment analyzed ${args.scannedAnimals} animals.`,
    metadata: {
      scanned_animals: args.scannedAnimals,
      ...args.summary,
    },
  });
}
