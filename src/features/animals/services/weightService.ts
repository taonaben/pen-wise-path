import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import type { WeightRecord } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const weightService = {
  async getWeightRecords(farmId: string, animalId?: string): Promise<WeightRecord[]> {
    let query = db
      .from("weight_records")
      .select("*")
      .eq("farm_id", farmId)
      .order("recorded_at", { ascending: false });

    if (animalId) query = query.eq("animal_id", animalId);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);
    return (data ?? []) as WeightRecord[];
  },

  async createInitialWeightRecord(args: {
    farmId: string;
    animalId: string;
    weightKg: number;
    recordedAt: string;
    createdBy?: string | null;
  }): Promise<WeightRecord> {
    const { data, error } = await db
      .from("weight_records")
      .insert({
        farm_id: args.farmId,
        animal_id: args.animalId,
        weight_kg: args.weightKg,
        recorded_at: args.recordedAt,
        notes: "Initial purchase weight",
        created_by: args.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Weight record insert returned no data") as WeightRecord;
  },
};
