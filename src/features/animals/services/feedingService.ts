import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "@/features/farm/services/auditService";
import { toNumber } from "./animalAnalyticsService";
import { penService } from "./penService";
import { weightService } from "./weightService";
import type {
  AnimalFeedAllocationViewModel,
  FeedAllocationMethod,
  FeedingEvent,
  FeedingEventAnimal,
  FeedingMethod,
  FeedType,
  WeightRecord,
} from "../types/animal.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

type CreateFeedingEventPayload = {
  farmId: string;
  feedTypeId: string;
  quantityKg: number;
  feedingDate: string;
  feedingMethod: FeedingMethod;
  allocationMethod: FeedAllocationMethod;
  animalIds?: string[];
  penId?: string | null;
  notes?: string | null;
};

type FeedAllocationRow = FeedingEventAnimal & {
  feeding_event: (FeedingEvent & { feed_type: FeedType | null }) | null;
};

function latestWeight(records: WeightRecord[]) {
  return [...records].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
}

function sourceLabel(event: FeedingEvent | null) {
  if (!event) return "Unknown";
  if (event.feeding_method === "individual") return "Individual";
  if (event.pen?.name) return `${event.pen.name} Batch`;
  return "Group Batch";
}

function mapFeedAllocation(row: FeedAllocationRow): AnimalFeedAllocationViewModel {
  const event = row.feeding_event;
  return {
    id: row.id,
    animalId: row.animal_id,
    eventId: row.feeding_event_id,
    date: event?.feeding_date ?? row.created_at,
    feedTypeName: event?.feed_type?.name ?? "Unspecified feed",
    source: sourceLabel(event),
    feedingMethod: event?.feeding_method ?? "individual",
    allocationMethod: event?.allocation_method ?? "equal_per_animal",
    allocatedQuantityKg: toNumber(row.allocated_quantity_kg),
    allocatedCost: toNumber(row.allocated_cost),
    notes: event?.notes ?? null,
    recordedBy: event?.created_by ?? null,
  };
}

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) handleSupabaseError(error);
  return data.user?.id ?? null;
}

async function getFeedType(feedTypeId: string): Promise<FeedType> {
  const { data, error } = await db.from("feed_types").select("*").eq("id", feedTypeId).single();
  if (error) handleSupabaseError(error);
  return requireData(data, "Feed type not found") as FeedType;
}

async function calculateAllocations(args: {
  farmId: string;
  animalIds: string[];
  quantityKg: number;
  costPerKg: number;
  allocationMethod: FeedAllocationMethod;
}) {
  if (args.animalIds.length === 0) return [];

  if (args.allocationMethod === "by_weight_percentage") {
    const latestWeights = new Map<string, number>();

    await Promise.all(
      args.animalIds.map(async (animalId) => {
        const records = await weightService.getAnimalWeights(args.farmId, animalId);
        const latest = latestWeight(records);
        if (latest) latestWeights.set(animalId, toNumber(latest.weight_kg));
      }),
    );

    const totalWeight = [...latestWeights.values()].reduce((total, weight) => total + weight, 0);
    if (totalWeight > 0 && latestWeights.size === args.animalIds.length) {
      return args.animalIds.map((animalId) => {
        const quantity = args.quantityKg * ((latestWeights.get(animalId) ?? 0) / totalWeight);
        return {
          animal_id: animalId,
          allocated_quantity_kg: quantity,
          allocated_cost: quantity * args.costPerKg,
        };
      });
    }
  }

  const equalQuantity = args.quantityKg / args.animalIds.length;
  return args.animalIds.map((animalId) => ({
    animal_id: animalId,
    allocated_quantity_kg: equalQuantity,
    allocated_cost: equalQuantity * args.costPerKg,
  }));
}

export const feedingService = {
  async getAnimalFeedAllocations(
    farmId: string,
    animalId: string,
  ): Promise<AnimalFeedAllocationViewModel[]> {
    const { data, error } = await db
      .from("feeding_event_animals")
      .select(
        `
          *,
          feeding_event:feeding_events(
            *,
            pen:pens(*),
            feed_type:feed_types(*)
          )
        `,
      )
      .eq("farm_id", farmId)
      .eq("animal_id", animalId);

    if (error) handleSupabaseError(error);

    return ((data ?? []) as FeedAllocationRow[])
      .map(mapFeedAllocation)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async createFeedingEvent(payload: CreateFeedingEventPayload): Promise<FeedingEvent> {
    const userId = await getCurrentUserId();
    const feedType = await getFeedType(payload.feedTypeId);

    let animalIds = payload.animalIds ?? [];
    if (payload.feedingMethod === "pen_group" && payload.penId) {
      const assignments = await penService.getActivePenAssignments(payload.farmId, payload.penId);
      animalIds = assignments.map((assignment) => assignment.animal_id);
    }

    const { data, error } = await db
      .from("feeding_events")
      .insert({
        farm_id: payload.farmId,
        pen_id: payload.penId ?? null,
        feed_type_id: payload.feedTypeId,
        feeding_method: payload.feedingMethod,
        quantity_kg: payload.quantityKg,
        feeding_date: payload.feedingDate,
        allocation_method: payload.allocationMethod,
        notes: payload.notes?.trim() || null,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) handleSupabaseError(error);
    const event = requireData(data, "Feeding event insert returned no data") as FeedingEvent;

    const allocations = await calculateAllocations({
      farmId: payload.farmId,
      animalIds,
      quantityKg: payload.quantityKg,
      costPerKg: toNumber(feedType.cost_per_kg),
      allocationMethod: payload.allocationMethod,
    });

    if (allocations.length > 0) {
      const { error: allocationError } = await db.from("feeding_event_animals").insert(
        allocations.map((allocation) => ({
          farm_id: payload.farmId,
          feeding_event_id: event.id,
          ...allocation,
        })),
      );

      if (allocationError) handleSupabaseError(allocationError);
    }

    await auditService.createAuditLog({
      farmId: payload.farmId,
      action: "create",
      entityType: "feeding_event",
      entityId: event.id,
      description: `Recorded ${payload.quantityKg}kg feeding event`,
      metadata: {
        feeding_method: payload.feedingMethod,
        allocation_method: payload.allocationMethod,
        affected_animals: animalIds.length,
      },
    });

    return event;
  },
};
