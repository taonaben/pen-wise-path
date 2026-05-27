import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type AnimalAlert = {
  id: string;
  farm_id: string;
  animal_id: string | null;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export const alertService = {
  async getAnimalAlerts(farmId: string, animalId: string): Promise<AnimalAlert[]> {
    const { data, error } = await db
      .from("alerts")
      .select("*")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as AnimalAlert[];
  },
};
