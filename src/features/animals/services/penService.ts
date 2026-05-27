import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { AnimalPenAssignment, Pen } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const penService = {
  async getPens(farmId: string): Promise<Pen[]> {
    const { data, error } = await db
      .from("pens")
      .select("*")
      .eq("farm_id", farmId)
      .order("name", { ascending: true });

    if (error) handleSupabaseError(error);
    return (data ?? []) as Pen[];
  },

  async getActivePenAssignments(farmId: string, penId: string): Promise<AnimalPenAssignment[]> {
    const { data, error } = await db
      .from("animal_pen_assignments")
      .select("*, pen:pens(*)")
      .eq("farm_id", farmId)
      .eq("pen_id", penId)
      .is("ended_at", null)
      .order("started_at", { ascending: true });

    if (error) handleSupabaseError(error);
    return (data ?? []) as AnimalPenAssignment[];
  },

  async getCurrentAnimalPen(farmId: string, animalId: string): Promise<AnimalPenAssignment | null> {
    const { data, error } = await db
      .from("animal_pen_assignments")
      .select("*, pen:pens(*)")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .is("ended_at", null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return (data ?? null) as AnimalPenAssignment | null;
  },
};
