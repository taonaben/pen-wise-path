import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { AnimalBreed } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const breedService = {
  async getBreeds(speciesId?: string): Promise<AnimalBreed[]> {
    let query = db
      .from("animal_breeds")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (speciesId) query = query.eq("species_id", speciesId);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);
    return (data ?? []) as AnimalBreed[];
  },
};
