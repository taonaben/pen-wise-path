import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type { FeedType, FeedTypeCreatePayload } from "../types/feed.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

export const feedTypeService = {
  async listByFarm(farmId: string): Promise<FeedType[]> {
    const { data, error } = await db
      .from("feed_types")
      .select("*")
      .eq("farm_id", farmId)
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error);
    return (data ?? []) as FeedType[];
  },

  async getById(farmId: string, feedTypeId: string): Promise<FeedType> {
    const { data, error } = await db
      .from("feed_types")
      .select("*")
      .eq("farm_id", farmId)
      .eq("id", feedTypeId)
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Feed type not found") as FeedType;
  },

  async create(payload: FeedTypeCreatePayload): Promise<FeedType> {
    const userId = await getCurrentUserId();

    const { data, error } = await db
      .from("feed_types")
      .insert({
        farm_id: payload.farmId,
        species_id: payload.speciesId ?? null,
        name: payload.name.trim(),
        category: payload.category,
        cost_per_kg: payload.costPerKg,
        protein_percentage: payload.proteinPercentage ?? null,
        dry_matter_percentage: payload.dryMatterPercentage ?? null,
        crude_fiber_percentage: payload.crudeFiberPercentage ?? null,
        energy_me_mj_per_kg: payload.energyMeMjPerKg ?? null,
        fat_percentage: payload.fatPercentage ?? null,
        calcium_percentage: payload.calciumPercentage ?? null,
        phosphorus_percentage: payload.phosphorusPercentage ?? null,
        low_stock_threshold_kg: payload.lowStockThresholdKg ?? 0,
        description: payload.description?.trim() || null,
        notes: payload.notes?.trim() || null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Feed type insert returned no data") as FeedType;
  },

  async update(feedTypeId: string, payload: Partial<FeedTypeCreatePayload>): Promise<FeedType> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.speciesId !== undefined) updatePayload.species_id = payload.speciesId;
    if (payload.name !== undefined) updatePayload.name = payload.name.trim();
    if (payload.category !== undefined) updatePayload.category = payload.category;
    if (payload.costPerKg !== undefined) updatePayload.cost_per_kg = payload.costPerKg;
    if (payload.proteinPercentage !== undefined)
      updatePayload.protein_percentage = payload.proteinPercentage;
    if (payload.dryMatterPercentage !== undefined)
      updatePayload.dry_matter_percentage = payload.dryMatterPercentage;
    if (payload.crudeFiberPercentage !== undefined)
      updatePayload.crude_fiber_percentage = payload.crudeFiberPercentage;
    if (payload.energyMeMjPerKg !== undefined)
      updatePayload.energy_me_mj_per_kg = payload.energyMeMjPerKg;
    if (payload.fatPercentage !== undefined) updatePayload.fat_percentage = payload.fatPercentage;
    if (payload.calciumPercentage !== undefined)
      updatePayload.calcium_percentage = payload.calciumPercentage;
    if (payload.phosphorusPercentage !== undefined)
      updatePayload.phosphorus_percentage = payload.phosphorusPercentage;
    if (payload.lowStockThresholdKg !== undefined)
      updatePayload.low_stock_threshold_kg = payload.lowStockThresholdKg;
    if (payload.description !== undefined)
      updatePayload.description = payload.description?.trim() || null;
    if (payload.notes !== undefined) updatePayload.notes = payload.notes?.trim() || null;

    const { data, error } = await db
      .from("feed_types")
      .update(updatePayload)
      .eq("id", feedTypeId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Feed type update returned no data") as FeedType;
  },
};
