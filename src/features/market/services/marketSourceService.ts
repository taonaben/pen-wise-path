import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "@/features/farm/services/auditService";
import type { MarketSource, MarketSourcePayload } from "../types/market.types";
import { cleanText } from "./marketFormat";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

function toInsertPayload(payload: MarketSourcePayload, createdBy?: string | null) {
  return {
    farm_id: payload.farmId,
    name: payload.name.trim(),
    source_type: payload.sourceType,
    location: cleanText(payload.location),
    contact_name: cleanText(payload.contactName),
    contact_phone: cleanText(payload.contactPhone),
    notes: cleanText(payload.notes),
    is_active: payload.isActive ?? true,
    created_by: createdBy ?? null,
  };
}

export const marketSourceService = {
  async getMarketSources(farmId: string): Promise<MarketSource[]> {
    const { data, error } = await db
      .from("market_sources")
      .select("*")
      .eq("farm_id", farmId)
      .order("is_active", { ascending: false })
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error);
    return (data ?? []) as MarketSource[];
  },

  async createMarketSource(payload: MarketSourcePayload): Promise<MarketSource> {
    const userId = await getCurrentUserId();
    const { data, error } = await db
      .from("market_sources")
      .insert(toInsertPayload(payload, userId))
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const source = requireData(data, "Market source insert returned no data") as MarketSource;

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "MARKET_SOURCE_CREATED",
      entityType: "market_source",
      entityId: source.id,
      description: `Created market source ${source.name}.`,
      metadata: { source_type: source.source_type },
    });

    return source;
  },

  async updateMarketSource(sourceId: string, payload: MarketSourcePayload): Promise<MarketSource> {
    const { data, error } = await db
      .from("market_sources")
      .update({
        name: payload.name.trim(),
        source_type: payload.sourceType,
        location: cleanText(payload.location),
        contact_name: cleanText(payload.contactName),
        contact_phone: cleanText(payload.contactPhone),
        notes: cleanText(payload.notes),
        is_active: payload.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const source = requireData(data, "Market source update returned no data") as MarketSource;

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "MARKET_SOURCE_UPDATED",
      entityType: "market_source",
      entityId: source.id,
      description: `Updated market source ${source.name}.`,
      metadata: { source_type: source.source_type, is_active: source.is_active },
    });

    return source;
  },

  async deactivateMarketSource(farmId: string, sourceId: string): Promise<MarketSource> {
    const { data, error } = await db
      .from("market_sources")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", sourceId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const source = requireData(data, "Market source deactivate returned no data") as MarketSource;

    await auditService.createAuditLog({
      farmId,
      action: "MARKET_SOURCE_DEACTIVATED",
      entityType: "market_source",
      entityId: source.id,
      description: `Deactivated market source ${source.name}.`,
      metadata: {},
    });

    return source;
  },
};
