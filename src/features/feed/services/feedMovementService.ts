import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type { FeedMovement, FeedMovementType } from "../types/feed.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type CreateFeedMovementPayload = {
  farmId: string;
  feedTypeId: string;
  feedBatchId?: string | null;
  movementType: FeedMovementType;
  quantityKg: number;
  unitCost?: number | null;
  movementDate: string;
  referenceType?: string | null;
  referenceId?: string | null;
  notes?: string | null;
};

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

export const feedMovementService = {
  async listByFarm(farmId: string): Promise<FeedMovement[]> {
    const { data, error } = await db
      .from("feed_movements")
      .select("*")
      .eq("farm_id", farmId)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as FeedMovement[];
  },

  async listByFeedType(farmId: string, feedTypeId: string): Promise<FeedMovement[]> {
    const { data, error } = await db
      .from("feed_movements")
      .select("*")
      .eq("farm_id", farmId)
      .eq("feed_type_id", feedTypeId)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as FeedMovement[];
  },

  async create(payload: CreateFeedMovementPayload): Promise<FeedMovement> {
    const userId = await getCurrentUserId();
    const totalCost =
      payload.unitCost === null || payload.unitCost === undefined
        ? null
        : Number(payload.unitCost) * Math.abs(Number(payload.quantityKg));

    const { data, error } = await db
      .from("feed_movements")
      .insert({
        farm_id: payload.farmId,
        feed_type_id: payload.feedTypeId,
        feed_batch_id: payload.feedBatchId ?? null,
        movement_type: payload.movementType,
        quantity_kg: payload.quantityKg,
        unit_cost: payload.unitCost ?? null,
        total_cost: totalCost,
        movement_date: payload.movementDate,
        reference_type: payload.referenceType ?? null,
        reference_id: payload.referenceId ?? null,
        notes: payload.notes?.trim() || null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Feed movement insert returned no data") as FeedMovement;
  },
};
