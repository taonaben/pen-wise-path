import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { AnimalSpecies } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const speciesService = {
  async getSpecies(): Promise<AnimalSpecies[]> {
    const { data, error } = await db
      .from("animal_species")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error);
    return (data ?? []) as AnimalSpecies[];
  },
};
