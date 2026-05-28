import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";
import { HttpError } from "../_shared/errors.ts";
import type { CandidateAlert, ExistingAlertRow } from "./types.ts";

const ENGINE_VERSION = "growth-engine-v1";

type PersistResult = {
  generated: number;
  updated: number;
  skipped: number;
};

export async function fetchExistingOpenAlerts(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalIds: string[];
}): Promise<ExistingAlertRow[]> {
  if (args.animalIds.length === 0) return [];

  const { data, error } = await args.adminClient
    .from("alerts")
    .select("id,farm_id,animal_id,alert_type,status,metadata")
    .eq("farm_id", args.farmId)
    .in("animal_id", args.animalIds)
    .eq("status", "open");

  if (error) {
    throw new HttpError("SCAN_FAILED", error.message, 500);
  }

  return (data ?? []) as ExistingAlertRow[];
}

export async function upsertGrowthAlerts(args: {
  adminClient: AnySupabaseClient;
  dryRun: boolean;
  regenerateExisting: boolean;
  farmId: string;
  animalId: string;
  existingOpenAlerts: ExistingAlertRow[];
  alerts: CandidateAlert[];
}): Promise<PersistResult> {
  let generated = 0;
  let updated = 0;
  let skipped = 0;

  for (const alert of args.alerts) {
    const existing = args.existingOpenAlerts.find(
      (row) => row.animal_id === args.animalId && row.alert_type === alert.alert_type,
    );

    if (existing && !args.regenerateExisting) {
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      if (existing) {
        updated += 1;
      } else {
        generated += 1;
      }
      continue;
    }

    const nowIso = new Date().toISOString();

    if (existing) {
      const occurrences = Number((existing.metadata?.occurrences as number | undefined) ?? 0) + 1;

      const { error } = await args.adminClient
        .from("alerts")
        .update({
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          detected_metric: alert.detected_metric,
          expected_value: alert.expected_value ?? null,
          actual_value: alert.actual_value ?? null,
          confidence: alert.confidence,
          source: alert.source,
          engine_version: ENGINE_VERSION,
          metadata: {
            ...(existing.metadata ?? {}),
            occurrences,
          },
          last_detected_at: nowIso,
          resolved: false,
          resolved_at: null,
          resolved_by: null,
          status: "open",
        })
        .eq("id", existing.id);

      if (error) {
        throw new HttpError("SCAN_FAILED", error.message, 500);
      }

      updated += 1;
      continue;
    }

    const { error } = await args.adminClient.from("alerts").insert({
      farm_id: args.farmId,
      animal_id: args.animalId,
      alert_type: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      status: "open",
      detected_metric: alert.detected_metric,
      expected_value: alert.expected_value ?? null,
      actual_value: alert.actual_value ?? null,
      confidence: alert.confidence,
      source: alert.source,
      engine_version: ENGINE_VERSION,
      metadata: {
        occurrences: 1,
      },
      last_detected_at: nowIso,
      resolved: false,
      resolved_at: null,
      resolved_by: null,
    });

    if (error) {
      throw new HttpError("SCAN_FAILED", error.message, 500);
    }

    generated += 1;
  }

  return { generated, updated, skipped };
}
