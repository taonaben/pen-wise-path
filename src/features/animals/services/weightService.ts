import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { toNumber } from "./animalAnalyticsService";
import type {
  AnimalBreed,
  AnimalSpecies,
  BulkWeightFilters,
  BulkWeightRow,
  Pen,
  WeightRecord,
} from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type BulkAnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  status: BulkWeightRow["status"];
  breed: string | null;
  species_id: string;
  breed_id: string | null;
  species: AnimalSpecies | null;
  breed_record: AnimalBreed | null;
};

type ActivePenAssignmentRow = {
  animal_id: string;
  pen_id: string;
  pen: Pen | null;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function assertNotFutureDate(recordedAt: string) {
  if (recordedAt > todayIsoDate()) {
    throw new Error("Weight date cannot be in the future");
  }
}

function applyBulkFilters(rows: BulkWeightRow[], filters: BulkWeightFilters = {}) {
  const search = filters.search?.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.speciesId && row.speciesId !== filters.speciesId) return false;
    if (filters.breedId && row.breedId !== filters.breedId) return false;
    if (filters.penId && row.penId !== filters.penId) return false;
    if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;

    if (search) {
      const haystack = [row.tagNumber, row.speciesLabel, row.breedLabel, row.penName, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

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

  async getAnimalWeights(farmId: string, animalId: string): Promise<WeightRecord[]> {
    return this.getWeightRecords(farmId, animalId);
  },

  async getWeightsForDate(farmId: string, recordedAt: string): Promise<WeightRecord[]> {
    const { data, error } = await db
      .from("weight_records")
      .select("*")
      .eq("farm_id", farmId)
      .eq("recorded_at", recordedAt)
      .order("created_at", { ascending: false });

    if (error) handleSupabaseError(error);
    return (data ?? []) as WeightRecord[];
  },

  async getBulkWeightRows(args: {
    farmId: string;
    recordedAt: string;
    filters?: BulkWeightFilters;
  }): Promise<BulkWeightRow[]> {
    assertNotFutureDate(args.recordedAt);

    const { data: animalsData, error: animalsError } = await db
      .from("animals")
      .select(
        `
          id,
          farm_id,
          tag_number,
          status,
          breed,
          species_id,
          breed_id,
          species:animal_species!animals_species_id_fkey(id, name, slug, description, is_active, created_at, updated_at),
          breed_record:animal_breeds!animals_breed_id_fkey(id, species_id, name, slug, description, is_active, created_at, updated_at)
        `,
      )
      .eq("farm_id", args.farmId)
      .order("tag_number", { ascending: true });

    if (animalsError) handleSupabaseError(animalsError);

    const animals = (animalsData ?? []) as BulkAnimalRow[];
    const animalIds = animals.map((animal) => animal.id);
    if (animalIds.length === 0) return [];

    const [
      { data: selectedWeightsData, error: selectedWeightsError },
      { data: previousWeightsData, error: previousWeightsError },
      { data: penAssignmentsData, error: penAssignmentsError },
    ] = await Promise.all([
      db
        .from("weight_records")
        .select("*")
        .eq("farm_id", args.farmId)
        .eq("recorded_at", args.recordedAt)
        .in("animal_id", animalIds),
      db
        .from("weight_records")
        .select("*")
        .eq("farm_id", args.farmId)
        .lt("recorded_at", args.recordedAt)
        .in("animal_id", animalIds)
        .order("recorded_at", { ascending: false }),
      db
        .from("animal_pen_assignments")
        .select("animal_id, pen_id, pen:pens(*)")
        .eq("farm_id", args.farmId)
        .is("ended_at", null)
        .in("animal_id", animalIds),
    ]);

    if (selectedWeightsError) handleSupabaseError(selectedWeightsError);
    if (previousWeightsError) handleSupabaseError(previousWeightsError);
    if (penAssignmentsError) handleSupabaseError(penAssignmentsError);

    const selectedByAnimal = new Map(
      ((selectedWeightsData ?? []) as WeightRecord[]).map((record) => [record.animal_id, record]),
    );
    const latestPreviousByAnimal = new Map<string, WeightRecord>();
    for (const record of (previousWeightsData ?? []) as WeightRecord[]) {
      if (!latestPreviousByAnimal.has(record.animal_id)) {
        latestPreviousByAnimal.set(record.animal_id, record);
      }
    }
    const penByAnimal = new Map(
      ((penAssignmentsData ?? []) as ActivePenAssignmentRow[]).map((assignment) => [
        assignment.animal_id,
        assignment,
      ]),
    );

    const rows = animals.map((animal) => {
      const selectedWeight = selectedByAnimal.get(animal.id);
      const previousWeight = latestPreviousByAnimal.get(animal.id);
      const penAssignment = penByAnimal.get(animal.id);

      return {
        animalId: animal.id,
        tagNumber: animal.tag_number,
        speciesId: animal.species_id ?? null,
        speciesLabel: animal.species?.name ?? "Unspecified",
        breedId: animal.breed_id ?? null,
        breedLabel: animal.breed_record?.name ?? animal.breed ?? "Unspecified",
        status: animal.status,
        penId: penAssignment?.pen_id ?? null,
        penName: penAssignment?.pen?.name ?? null,
        existingWeightRecordId: selectedWeight?.id ?? null,
        existingWeightKg: selectedWeight ? toNumber(selectedWeight.weight_kg) : null,
        latestPreviousWeightKg: previousWeight ? toNumber(previousWeight.weight_kg) : null,
        latestPreviousWeightDate: previousWeight?.recorded_at ?? null,
      };
    });

    return applyBulkFilters(rows, args.filters);
  },

  async upsertAnimalWeight(args: {
    farmId: string;
    animalId: string;
    recordedAt: string;
    weightKg: number;
    notes?: string | null;
  }): Promise<WeightRecord> {
    assertNotFutureDate(args.recordedAt);
    if (!(args.weightKg > 0)) throw new Error("Weight must be greater than zero");
    if (args.weightKg > 2000) throw new Error("Weight must be 2000kg or less");

    const userId = await getCurrentUserId();
    const { data, error } = await db
      .from("weight_records")
      .upsert(
        {
          farm_id: args.farmId,
          animal_id: args.animalId,
          weight_kg: args.weightKg,
          recorded_at: args.recordedAt,
          notes: args.notes?.trim() || "Bulk weighing entry",
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "farm_id,animal_id,recorded_at" },
      )
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    return requireData(data, "Weight upsert returned no data") as WeightRecord;
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
