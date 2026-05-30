import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import type { AnimalPenAssignment, Pen } from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const presentAnimalStatuses = ["active", "sick"];

type AnimalPenAssignmentRow = AnimalPenAssignment & {
  animal?: { id: string; status: string | null } | null;
};

function onlyPresentAssignments(rows: AnimalPenAssignmentRow[]): AnimalPenAssignment[] {
  return rows
    .filter((row) => presentAnimalStatuses.includes(row.animal?.status ?? "active"))
    .map(({ animal: _animal, ...assignment }) => assignment as AnimalPenAssignment);
}

type CreatePenPayload = {
  farmId: string;
  name: string;
  speciesId?: string | null;
  capacity?: number | null;
  status?: "active" | "inactive" | "maintenance";
  notes?: string | null;
};

type AssignAnimalToPenPayload = {
  farmId: string;
  animalId: string;
  penId: string;
  startedAt?: string;
  reason?: string | null;
};

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
      .select("*, pen:pens(*), animal:animals(id,status)")
      .eq("farm_id", farmId)
      .eq("pen_id", penId)
      .is("ended_at", null)
      .order("started_at", { ascending: true });

    if (error) handleSupabaseError(error);
    return onlyPresentAssignments((data ?? []) as AnimalPenAssignmentRow[]);
  },

  async getCurrentAssignmentsByFarm(farmId: string): Promise<AnimalPenAssignment[]> {
    const { data, error } = await db
      .from("animal_pen_assignments")
      .select("*, pen:pens(*), animal:animals(id,status)")
      .eq("farm_id", farmId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return onlyPresentAssignments((data ?? []) as AnimalPenAssignmentRow[]);
  },

  async getCurrentAnimalPen(farmId: string, animalId: string): Promise<AnimalPenAssignment | null> {
    const { data, error } = await db
      .from("animal_pen_assignments")
      .select("*, pen:pens(*), animal:animals(id,status)")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .is("ended_at", null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    const rows = data ? onlyPresentAssignments([data as AnimalPenAssignmentRow]) : [];
    return rows[0] ?? null;
  },

  async createPen(payload: CreatePenPayload): Promise<Pen> {
    const { data, error } = await db
      .from("pens")
      .insert({
        farm_id: payload.farmId,
        name: payload.name.trim(),
        species_id: payload.speciesId ?? null,
        capacity: payload.capacity ?? null,
        status: payload.status ?? "active",
        notes: payload.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return data as Pen;
  },

  async assignAnimalToPen(payload: AssignAnimalToPenPayload): Promise<AnimalPenAssignment> {
    await this.clearCurrentAssignment(payload.farmId, payload.animalId);

    const { data, error } = await db
      .from("animal_pen_assignments")
      .insert({
        farm_id: payload.farmId,
        animal_id: payload.animalId,
        pen_id: payload.penId,
        started_at: payload.startedAt ?? new Date().toISOString().slice(0, 10),
        reason: payload.reason?.trim() || null,
      })
      .select("*, pen:pens(*)")
      .single();

    if (error) handleSupabaseError(error);
    return data as AnimalPenAssignment;
  },

  async clearCurrentAssignment(farmId: string, animalId: string): Promise<void> {
    const { error } = await db
      .from("animal_pen_assignments")
      .update({
        ended_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("farm_id", farmId)
      .eq("animal_id", animalId)
      .is("ended_at", null);

    if (error) handleSupabaseError(error);
  },
};
