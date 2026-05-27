import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { HealthEvent } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const healthService = {
  async getAnimalHealthEvents(farmId: string, animalId: string): Promise<HealthEvent[]> {
    const { data, error } = await db
      .from("health_events")
      .select("*")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .order("event_date", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as HealthEvent[];
  },
};
