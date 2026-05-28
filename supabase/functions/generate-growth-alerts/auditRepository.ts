import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";

export async function writeScanAuditLog(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  farmId: string;
  userId: string;
  scannedAnimals: number;
  generatedAlerts: number;
  updatedAlerts: number;
  skippedAlerts: number;
}) {
  await args.adminClient.from("audit_logs").insert({
    farm_id: args.farmId,
    user_id: args.userId,
    action: "GROWTH_SCAN_RUN",
    entity_type: "growth_alert_scan",
    description: `Growth scan analyzed ${args.scannedAnimals} animals and generated ${args.generatedAlerts} alerts.`,
    metadata: {
      dry_run: args.dryRun,
      scanned_animals: args.scannedAnimals,
      generated_alerts: args.generatedAlerts,
      updated_alerts: args.updatedAlerts,
      skipped_alerts: args.skippedAlerts,
    },
  });
}
