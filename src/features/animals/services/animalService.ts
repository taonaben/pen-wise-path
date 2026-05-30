import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "@/features/farm/services/auditService";
import {
  calculateAverageDailyGain,
  classifyAnimalPerformance,
  getSellingRecommendation,
  toNumber,
} from "./animalAnalyticsService";
import { weightService } from "./weightService";
import type {
  Animal,
  AnimalAcquisitionMethod,
  AnimalCreatePayload,
  AnimalFilters,
  AnimalSummary,
  AnimalUpdatePayload,
  AnimalViewModel,
  AnimalWithRelations,
  WeightRecord,
} from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const animalSelect = `
  *,
  species:animal_species!animals_species_id_fkey(id, name, slug, description, is_active, created_at, updated_at),
  breed_record:animal_breeds!animals_breed_id_fkey(id, species_id, name, slug, description, is_active, created_at, updated_at)
`;

function normalizeStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function normalizeAcquisitionMethod(method: AnimalAcquisitionMethod | null | undefined) {
  return method === "bred_in_house" ? "Bred in-house" : "Purchased";
}

function groupWeightsByAnimal(records: WeightRecord[]) {
  const grouped = new Map<string, WeightRecord[]>();

  for (const record of records) {
    const current = grouped.get(record.animal_id) ?? [];
    current.push(record);
    grouped.set(record.animal_id, current);
  }

  return grouped;
}

function latestWeight(records: WeightRecord[]) {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
}

function mapAnimalToViewModel(
  animal: AnimalWithRelations,
  records: WeightRecord[],
): AnimalViewModel {
  const latest = latestWeight(records);
  const currentWeightKg = latest ? toNumber(latest.weight_kg) : toNumber(animal.purchase_weight_kg);
  const averageDailyGainKg = calculateAverageDailyGain(records);
  const speciesSlug = animal.species?.slug ?? "cattle";
  const performance = classifyAnimalPerformance(averageDailyGainKg, speciesSlug);

  return {
    id: animal.id,
    farmId: animal.farm_id,
    tagNumber: animal.tag_number,
    legacyBreed: animal.breed,
    species: animal.species,
    breed: animal.breed_record,
    speciesLabel: animal.species?.name ?? "Cattle",
    speciesSlug,
    breedLabel: animal.breed_record?.name ?? animal.breed ?? "Unspecified",
    sex: animal.sex,
    status: animal.status,
    statusLabel: normalizeStatus(animal.status),
    acquisitionMethod: animal.acquisition_method ?? "purchased",
    acquisitionLabel: normalizeAcquisitionMethod(animal.acquisition_method),
    purchaseWeightKg: toNumber(animal.purchase_weight_kg),
    purchasePrice: toNumber(animal.purchase_price),
    purchaseDate: animal.purchase_date,
    currentWeightKg,
    averageDailyGainKg,
    performance,
    recommendation: getSellingRecommendation(currentWeightKg, averageDailyGainKg, speciesSlug),
    notes: animal.notes,
    createdAt: animal.created_at,
  };
}

function filterViewModels(rows: AnimalViewModel[], filters: AnimalFilters = {}) {
  const search = filters.search?.trim().toLowerCase();

  return rows.filter((animal) => {
    if (search) {
      const haystack = [
        animal.tagNumber,
        animal.legacyBreed,
        animal.breedLabel,
        animal.speciesLabel,
        animal.statusLabel,
        animal.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    if (
      filters.performance &&
      filters.performance !== "all" &&
      animal.performance !== filters.performance
    ) {
      return false;
    }

    return true;
  });
}

function summarizeAnimals(rows: AnimalViewModel[]): AnimalSummary {
  return {
    total: rows.length,
    cattle: rows.filter((animal) => animal.speciesSlug === "cattle").length,
    pigs: rows.filter((animal) => animal.speciesSlug === "pigs").length,
    goats: rows.filter((animal) => animal.speciesSlug === "goats").length,
    underperforming: rows.filter((animal) =>
      ["Critical", "Underperforming"].includes(animal.performance),
    ).length,
    readyForSale: rows.filter((animal) => animal.recommendation === "Ready for sale").length,
  };
}

async function getBreedName(breedId?: string | null) {
  if (!breedId) return null;

  const { data, error } = await db.from("animal_breeds").select("name").eq("id", breedId).single();
  if (error) handleSupabaseError(error);
  return (data as { name: string } | null)?.name ?? null;
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

export const animalService = {
  mapAnimalToViewModel,

  async getAnimals(args: {
    farmId: string;
    filters?: AnimalFilters;
  }): Promise<{ animals: AnimalViewModel[]; summary: AnimalSummary }> {
    let query = db
      .from("animals")
      .select(animalSelect)
      .eq("farm_id", args.farmId)
      .order("created_at", { ascending: false });

    if (args.filters?.speciesId) query = query.eq("species_id", args.filters.speciesId);
    if (args.filters?.breedId) query = query.eq("breed_id", args.filters.breedId);
    if (args.filters?.status && args.filters.status !== "all") {
      query = query.eq("status", args.filters.status);
    }
    if (args.filters?.sex && args.filters.sex !== "all") query = query.eq("sex", args.filters.sex);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);

    const animals = (data ?? []) as AnimalWithRelations[];
    const ids = animals.map((animal) => animal.id);
    const weightRecords = ids.length ? await weightService.getWeightRecords(args.farmId) : [];
    const groupedWeights = groupWeightsByAnimal(
      weightRecords.filter((record) => ids.includes(record.animal_id)),
    );

    const mapped = animals.map((animal) =>
      mapAnimalToViewModel(animal, groupedWeights.get(animal.id) ?? []),
    );
    const filtered = filterViewModels(mapped, args.filters);

    return {
      animals: filtered,
      summary: summarizeAnimals(filtered),
    };
  },

  async getAnimal(farmId: string, animalId: string): Promise<AnimalViewModel> {
    const { data, error } = await db
      .from("animals")
      .select(animalSelect)
      .eq("farm_id", farmId)
      .eq("id", animalId)
      .single();

    if (error) handleSupabaseError(error);

    const animal = requireData(data, "Animal not found") as AnimalWithRelations;
    const records = await weightService.getWeightRecords(farmId, animalId);
    return mapAnimalToViewModel(animal, records);
  },

  async createAnimal(payload: AnimalCreatePayload): Promise<Animal> {
    const userId = await getCurrentUserId();
    const breedName = await getBreedName(payload.breedId);

    const { data, error } = await db
      .from("animals")
      .insert({
        farm_id: payload.farmId,
        species_id: payload.speciesId,
        breed_id: payload.breedId ?? null,
        breed: breedName,
        acquisition_method: payload.acquisitionMethod,
        tag_number: payload.tagNumber.trim(),
        sex: payload.sex,
        purchase_date: payload.purchaseDate,
        purchase_weight_kg: payload.purchaseWeightKg,
        purchase_price: payload.purchasePrice,
        status: "active",
        notes: payload.notes?.trim() || null,
        metadata: payload.metadata ?? {},
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const animal = requireData(data, "Animal insert returned no data") as Animal;

    await weightService.createInitialWeightRecord({
      farmId: payload.farmId,
      animalId: animal.id,
      weightKg: payload.purchaseWeightKg,
      recordedAt: payload.purchaseDate,
      createdBy: userId,
    });

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "create",
      entityType: "animal",
      entityId: animal.id,
      description: `Created animal ${animal.tag_number}`,
      metadata: {
        species_id: payload.speciesId,
        breed_id: payload.breedId ?? null,
        acquisition_method: payload.acquisitionMethod,
      },
    });

    return animal;
  },

  async updateAnimal(payload: AnimalUpdatePayload): Promise<Animal> {
    const breedName =
      payload.breedId === undefined ? undefined : await getBreedName(payload.breedId);

    const { data: existingData, error: existingError } = await db
      .from("animals")
      .select("*")
      .eq("farm_id", payload.farmId)
      .eq("id", payload.animalId)
      .single();

    if (existingError) handleSupabaseError(existingError);
    const existing = requireData(existingData, "Animal not found") as Animal;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.speciesId !== undefined) updatePayload.species_id = payload.speciesId;
    if (payload.breedId !== undefined) {
      updatePayload.breed_id = payload.breedId;
      updatePayload.breed = breedName;
    }
    if (payload.acquisitionMethod !== undefined) {
      updatePayload.acquisition_method = payload.acquisitionMethod;
    }
    if (payload.tagNumber !== undefined) updatePayload.tag_number = payload.tagNumber.trim();
    if (payload.sex !== undefined) updatePayload.sex = payload.sex;
    if (payload.purchaseDate !== undefined) updatePayload.purchase_date = payload.purchaseDate;
    if (payload.purchaseWeightKg !== undefined)
      updatePayload.purchase_weight_kg = payload.purchaseWeightKg;
    if (payload.purchasePrice !== undefined) updatePayload.purchase_price = payload.purchasePrice;
    if (payload.status !== undefined) updatePayload.status = payload.status;
    if (payload.notes !== undefined) updatePayload.notes = payload.notes?.trim() || null;
    if (payload.metadata !== undefined) updatePayload.metadata = payload.metadata;

    const { data, error } = await db
      .from("animals")
      .update(updatePayload)
      .eq("farm_id", payload.farmId)
      .eq("id", payload.animalId)
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const updated = requireData(data, "Animal update returned no data") as Animal;

    const changedFields = Object.keys(updatePayload).filter((field) => field !== "updated_at");
    const isStatusOnlyChange = changedFields.length === 1 && changedFields[0] === "status";

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: isStatusOnlyChange ? "change_status" : "update",
      entityType: "animal",
      entityId: updated.id,
      description: isStatusOnlyChange
        ? `Changed animal ${updated.tag_number} status from ${existing.status} to ${updated.status}`
        : `Updated animal ${updated.tag_number}`,
      metadata: {
        changed_fields: changedFields,
        before: {
          tag_number: existing.tag_number,
          species_id: existing.species_id,
          breed_id: existing.breed_id,
          sex: existing.sex,
          purchase_date: existing.purchase_date,
          purchase_weight_kg: existing.purchase_weight_kg,
          purchase_price: existing.purchase_price,
          acquisition_method: existing.acquisition_method,
          status: existing.status,
          notes: existing.notes,
        },
        after: {
          tag_number: updated.tag_number,
          species_id: updated.species_id,
          breed_id: updated.breed_id,
          sex: updated.sex,
          purchase_date: updated.purchase_date,
          purchase_weight_kg: updated.purchase_weight_kg,
          purchase_price: updated.purchase_price,
          acquisition_method: updated.acquisition_method,
          status: updated.status,
          notes: updated.notes,
        },
      },
    });

    return updated;
  },

  async deleteAnimal(args: { farmId: string; animalId: string }): Promise<void> {
    const { data: existingData, error: existingError } = await db
      .from("animals")
      .select("*")
      .eq("farm_id", args.farmId)
      .eq("id", args.animalId)
      .single();

    if (existingError) handleSupabaseError(existingError);
    const existing = requireData(existingData, "Animal not found") as Animal;

    const { error } = await db
      .from("animals")
      .delete()
      .eq("farm_id", args.farmId)
      .eq("id", args.animalId);

    if (error) handleSupabaseError(error);

    await auditService.createAuditLog({
      farmId: args.farmId,
      action: "delete",
      entityType: "animal",
      entityId: existing.id,
      description: `Deleted animal ${existing.tag_number}`,
      metadata: {
        deleted_animal: {
          tag_number: existing.tag_number,
          species_id: existing.species_id,
          breed_id: existing.breed_id,
          breed: existing.breed,
          sex: existing.sex,
          purchase_date: existing.purchase_date,
          purchase_weight_kg: existing.purchase_weight_kg,
          purchase_price: existing.purchase_price,
          acquisition_method: existing.acquisition_method,
          status: existing.status,
          notes: existing.notes,
          created_at: existing.created_at,
        },
      },
    });
  },
};
