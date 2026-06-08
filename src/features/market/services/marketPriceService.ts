import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "@/features/farm/services/auditService";
import type { Profile } from "@/features/farm/types/farm.types";
import type {
  MarketPrice,
  MarketPriceFilters,
  MarketPricePayload,
  MarketPriceViewModel,
} from "../types/market.types";
import { cleanText, toNumber } from "./marketFormat";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

function validatePayload(payload: MarketPricePayload) {
  if (!payload.speciesId) throw new Error("Species is required");
  if (!payload.marketSourceId) throw new Error("Market source is required");
  if (!(payload.pricePerKg > 0)) throw new Error("Price per kg must be greater than 0");
  if (!payload.currency.trim()) throw new Error("Currency is required");
  if (!payload.priceBasis) throw new Error("Price basis is required");
  if (!payload.recordedAt) throw new Error("Recorded date is required");
  if (
    payload.weightMinKg !== null &&
    payload.weightMinKg !== undefined &&
    payload.weightMaxKg !== null &&
    payload.weightMaxKg !== undefined &&
    payload.weightMinKg > payload.weightMaxKg
  ) {
    throw new Error("Minimum weight cannot exceed maximum weight");
  }
}

function mapMarketPrice(row: MarketPrice): MarketPriceViewModel {
  return {
    id: row.id,
    speciesId: row.species_id,
    speciesName: row.species?.name ?? "Unspecified",
    sourceId: row.market_source_id,
    sourceName: row.market_source?.name ?? row.source ?? "Unspecified source",
    sourceType: row.market_source?.source_type ?? null,
    pricePerKg: toNumber(row.price_per_kg),
    currency: row.currency ?? "USD",
    priceBasis: row.price_basis ?? "live_weight",
    recordedAt: row.recorded_at,
    qualityGrade: row.quality_grade,
    weightMinKg: row.weight_min_kg === null ? null : toNumber(row.weight_min_kg),
    weightMaxKg: row.weight_max_kg === null ? null : toNumber(row.weight_max_kg),
    notes: row.notes,
    recordedBy: row.created_by,
  };
}

function displayProfileName(profile: Profile | undefined, userId: string | null) {
  if (!userId) return null;
  return profile?.full_name || profile?.email || `User ${userId.slice(0, 8)}`;
}

async function getProfilesById(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, Profile>();

  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  if (error) handleSupabaseError(error);

  return new Map(((data ?? []) as Profile[]).map((profile) => [profile.id, profile]));
}

async function enrichRecordedBy(rows: MarketPriceViewModel[]) {
  const userIds = [
    ...new Set(
      rows.map((row) => row.recordedBy).filter((value): value is string => Boolean(value)),
    ),
  ];
  const profilesById = await getProfilesById(userIds);

  return rows.map((row) => ({
    ...row,
    recordedBy: displayProfileName(profilesById.get(row.recordedBy ?? ""), row.recordedBy),
  }));
}

function toDbPayload(payload: MarketPricePayload, userId?: string | null) {
  return {
    farm_id: payload.farmId,
    species_id: payload.speciesId,
    market_source_id: payload.marketSourceId,
    price_per_kg: payload.pricePerKg,
    currency: payload.currency.trim().toUpperCase(),
    price_basis: payload.priceBasis,
    recorded_at: payload.recordedAt,
    quality_grade: cleanText(payload.qualityGrade),
    weight_min_kg: payload.weightMinKg ?? null,
    weight_max_kg: payload.weightMaxKg ?? null,
    notes: cleanText(payload.notes),
    created_by: userId ?? null,
  };
}

export const marketPriceService = {
  mapMarketPrice,

  async getMarketPrices(
    farmId: string,
    filters: MarketPriceFilters = {},
  ): Promise<MarketPriceViewModel[]> {
    let query = db
      .from("market_prices")
      .select(
        `
          *,
          species:animal_species(*),
          market_source:market_sources(*)
        `,
      )
      .eq("farm_id", farmId)
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.speciesId) query = query.eq("species_id", filters.speciesId);
    if (filters.marketSourceId) query = query.eq("market_source_id", filters.marketSourceId);
    if (filters.priceBasis) query = query.eq("price_basis", filters.priceBasis);
    if (filters.currency) query = query.eq("currency", filters.currency);
    if (filters.dateFrom) query = query.gte("recorded_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("recorded_at", filters.dateTo);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);
    return enrichRecordedBy(((data ?? []) as MarketPrice[]).map(mapMarketPrice));
  },

  async getLatestMarketPrice(
    farmId: string,
    speciesId: string,
  ): Promise<MarketPriceViewModel | null> {
    const { data, error } = await db
      .from("market_prices")
      .select("*, species:animal_species(*), market_source:market_sources(*)")
      .eq("farm_id", farmId)
      .eq("species_id", speciesId)
      .eq("price_basis", "live_weight")
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? mapMarketPrice(data as MarketPrice) : null;
  },

  async getRecentAverageMarketPrice(
    farmId: string,
    speciesId: string,
    limit = 5,
  ): Promise<number | null> {
    const { data, error } = await db
      .from("market_prices")
      .select("*")
      .eq("farm_id", farmId)
      .eq("species_id", speciesId)
      .eq("price_basis", "live_weight")
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error);
    const rows = (data ?? []) as MarketPrice[];
    if (rows.length === 0) return null;
    return rows.reduce((sum, row) => sum + toNumber(row.price_per_kg), 0) / rows.length;
  },

  async createMarketPrice(payload: MarketPricePayload): Promise<MarketPriceViewModel> {
    validatePayload(payload);
    const userId = await getCurrentUserId();
    const { data, error } = await db
      .from("market_prices")
      .insert(toDbPayload(payload, userId))
      .select("*, species:animal_species(*), market_source:market_sources(*)")
      .single();

    if (error) handleSupabaseError(error);
    const row = mapMarketPrice(
      requireData(data, "Market price insert returned no data") as MarketPrice,
    );

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "MARKET_PRICE_CREATED",
      entityType: "market_price",
      entityId: row.id,
      description: `Recorded ${row.speciesName} market price of ${row.currency} ${row.pricePerKg.toFixed(2)}/kg from ${row.sourceName}.`,
      metadata: { species_id: row.speciesId, market_source_id: row.sourceId },
    });

    return row;
  },

  async updateMarketPrice(
    priceId: string,
    payload: MarketPricePayload,
  ): Promise<MarketPriceViewModel> {
    validatePayload(payload);
    const { created_by: _createdBy, farm_id: _farmId, ...updatePayload } = toDbPayload(payload);
    const { data, error } = await db
      .from("market_prices")
      .update(updatePayload)
      .eq("id", priceId)
      .select("*, species:animal_species(*), market_source:market_sources(*)")
      .single();

    if (error) handleSupabaseError(error);
    const row = mapMarketPrice(
      requireData(data, "Market price update returned no data") as MarketPrice,
    );

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "MARKET_PRICE_UPDATED",
      entityType: "market_price",
      entityId: row.id,
      description: `Updated ${row.speciesName} market price from ${row.sourceName}.`,
      metadata: { species_id: row.speciesId, market_source_id: row.sourceId },
    });

    return row;
  },

  async deleteMarketPrice(farmId: string, priceId: string): Promise<void> {
    const { data } = await db
      .from("market_prices")
      .select("id, price_per_kg, species:animal_species(name), market_source:market_sources(name)")
      .eq("id", priceId)
      .maybeSingle();

    const { error } = await db.from("market_prices").delete().eq("id", priceId);
    if (error) handleSupabaseError(error);

    await auditService.createAuditLog({
      farmId,
      action: "MARKET_PRICE_DELETED",
      entityType: "market_price",
      entityId: priceId,
      description: "Deleted market price record.",
      metadata: data ?? {},
    });
  },
};
