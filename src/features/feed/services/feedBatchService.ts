import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { feedMovementService } from "./feedMovementService";
import type { FeedBatch, FeedBatchCreatePayload } from "../types/feed.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

export const feedBatchService = {
  async listByFarm(farmId: string): Promise<FeedBatch[]> {
    const { data, error } = await db
      .from("feed_batches")
      .select("*")
      .eq("farm_id", farmId)
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as FeedBatch[];
  },

  async listByFeedType(farmId: string, feedTypeId: string): Promise<FeedBatch[]> {
    const { data, error } = await db
      .from("feed_batches")
      .select("*")
      .eq("farm_id", farmId)
      .eq("feed_type_id", feedTypeId)
      .order("purchase_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as FeedBatch[];
  },

  async create(payload: FeedBatchCreatePayload): Promise<FeedBatch> {
    const userId = await getCurrentUserId();

    const { data, error } = await db
      .from("feed_batches")
      .insert({
        farm_id: payload.farmId,
        feed_type_id: payload.feedTypeId,
        batch_number: payload.batchNumber?.trim() || null,
        supplier_name: payload.supplierName?.trim() || null,
        purchase_date: payload.purchaseDate,
        expiry_date: payload.expiryDate ?? null,
        initial_quantity_kg: payload.initialQuantityKg,
        unit_cost: payload.unitCost,
        storage_location: payload.storageLocation?.trim() || null,
        nutrition_snapshot: payload.nutritionSnapshot ?? {},
        notes: payload.notes?.trim() || null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);

    const batch = requireData(data, "Feed batch insert returned no data") as FeedBatch;

    await feedMovementService.create({
      farmId: payload.farmId,
      feedTypeId: payload.feedTypeId,
      feedBatchId: batch.id,
      movementType: "purchase",
      quantityKg: payload.initialQuantityKg,
      unitCost: payload.unitCost,
      movementDate: payload.purchaseDate,
      referenceType: "feed_batch",
      referenceId: batch.id,
      notes: "Purchase receipt",
    });

    return batch;
  },
};
