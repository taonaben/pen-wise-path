import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type { AuditLog, AuditLogViewModel, Profile } from "../types/farm.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type CreateAuditLogPayload = {
  farmId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

function mapAuditLog(log: AuditLog, actor?: Profile): AuditLogViewModel {
  return {
    id: log.id,
    actorName: actor?.full_name || actor?.email || "System",
    actorEmail: actor?.email ?? null,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    description: log.description || log.action,
    metadata: log.metadata ?? {},
    createdAt: log.created_at,
  };
}

export const auditService = {
  async createAuditLog(payload: CreateAuditLogPayload): Promise<AuditLog> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await db
      .from("audit_logs")
      .insert({
        farm_id: payload.farmId,
        user_id: userData.user?.id ?? null,
        action: payload.action,
        entity_type: payload.entityType,
        entity_id: payload.entityId ?? null,
        description: payload.description,
        metadata: payload.metadata ?? {},
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Audit log insert returned no data") as AuditLog;
  },

  async getAuditLogs(farmId: string): Promise<AuditLogViewModel[]> {
    const { data, error } = await db
      .from("audit_logs")
      .select("*")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) handleSupabaseError(error);

    const logs = (data ?? []) as AuditLog[];
    const actorIds = [...new Set(logs.map((log) => log.user_id).filter(Boolean))] as string[];

    const profilesById = new Map<string, Profile>();
    if (actorIds.length > 0) {
      const { data: profiles, error: profileError } = await db
        .from("profiles")
        .select("*")
        .in("id", actorIds);

      if (profileError) handleSupabaseError(profileError);
      for (const profile of (profiles ?? []) as Profile[]) {
        profilesById.set(profile.id, profile);
      }
    }

    return logs.map((log) =>
      mapAuditLog(log, log.user_id ? profilesById.get(log.user_id) : undefined),
    );
  },
};
