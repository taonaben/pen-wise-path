import { HttpError } from "../_shared/errors.ts";
import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";
import type {
  AlertRow,
  AnimalRow,
  FeedAllocationRow,
  MarketPriceRow,
  PredictionData,
  WeightRecordRow,
} from "./types.ts";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

function groupBy<T>(rows: T[], keyFn: (row: T) => string | null): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return grouped;
}

export async function fetchPredictionData(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId?: string;
}): Promise<PredictionData> {
  let animalQuery = args.adminClient
    .from("animals")
    .select(
      `
        id,
        farm_id,
        tag_number,
        species_id,
        purchase_weight_kg,
        purchase_price,
        purchase_date,
        status,
        species:animal_species!animals_species_id_fkey(id, slug, name)
      `,
    )
    .eq("farm_id", args.farmId)
    .eq("status", "active");

  if (args.animalId) animalQuery = animalQuery.eq("id", args.animalId);

  const { data: animalData, error: animalError } = await animalQuery;
  if (animalError) throw new HttpError("PREDICTION_FAILED", animalError.message, 500);

  const animals = (animalData ?? []) as AnimalRow[];
  if (args.animalId && animals.length === 0) {
    throw new HttpError("ANIMAL_NOT_FOUND", "Animal does not exist in this farm", 404);
  }

  const animalIds = animals.map((animal) => animal.id);
  const speciesIds = [...new Set(animals.map((animal) => animal.species_id).filter(Boolean))];
  const idsForQuery = animalIds.length ? animalIds : [EMPTY_UUID];
  const speciesForQuery = speciesIds.length ? speciesIds : [EMPTY_UUID];

  const [
    { data: weightData, error: weightError },
    { data: feedData, error: feedError },
    { data: marketData, error: marketError },
    { data: alertData, error: alertError },
  ] = await Promise.all([
    args.adminClient
      .from("weight_records")
      .select("animal_id,weight_kg,recorded_at")
      .eq("farm_id", args.farmId)
      .in("animal_id", idsForQuery)
      .order("recorded_at", { ascending: true }),
    args.adminClient
      .from("feeding_event_animals")
      .select("animal_id,allocated_quantity_kg,allocated_cost,feeding_event:feeding_events(feeding_date)")
      .eq("farm_id", args.farmId)
      .in("animal_id", idsForQuery),
    args.adminClient
      .from("market_prices")
      .select("species_id,price_per_kg,recorded_at,currency,price_basis")
      .eq("farm_id", args.farmId)
      .in("species_id", speciesForQuery)
      .eq("price_basis", "live_weight")
      .order("recorded_at", { ascending: false }),
    args.adminClient
      .from("alerts")
      .select("animal_id,alert_type,severity,status")
      .eq("farm_id", args.farmId)
      .in("animal_id", idsForQuery)
      .in("status", ["open", "reviewing"])
      .in("severity", ["high", "critical"]),
  ]);

  if (weightError) throw new HttpError("PREDICTION_FAILED", weightError.message, 500);
  if (feedError) throw new HttpError("PREDICTION_FAILED", feedError.message, 500);
  if (marketError) throw new HttpError("PREDICTION_FAILED", marketError.message, 500);
  if (alertError) throw new HttpError("PREDICTION_FAILED", alertError.message, 500);

  return {
    animals,
    weightsByAnimal: groupBy((weightData ?? []) as WeightRecordRow[], (row) => row.animal_id),
    feedByAnimal: groupBy((feedData ?? []) as FeedAllocationRow[], (row) => row.animal_id),
    marketPricesBySpecies: groupBy((marketData ?? []) as MarketPriceRow[], (row) => row.species_id),
    alertsByAnimal: groupBy((alertData ?? []) as AlertRow[], (row) => row.animal_id),
  };
}
