import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import { getSpeciesConfig } from "@/features/animals/config/speciesConfig";
import { toNumber } from "@/features/animals/services/animalAnalyticsService";
import type {
  Animal,
  AnimalPenAssignment,
  AnimalSpecies,
  AnimalStatus,
  FeedingEvent,
  FeedingEventAnimal,
  FeedType,
  Pen,
  WeightRecord,
} from "@/features/animals/types/animal.types";
import type {
  AnimalFeedCostRow,
  FeedCostAnalysisFilters,
  FeedCostAnalysisResult,
  FeedCostBreakdownPoint,
  FeedCostInsight,
  FeedCostStatus,
  FeedCostTrendPoint,
  FeedTypeEfficiencyRow,
  PenFeedCostRow,
} from "../types/feedCostAnalysis.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const speciesMaxFcr: Record<string, number> = {
  cattle: 7,
  pigs: 4,
  goats: 9,
};

type AnalysisEventRow = FeedingEvent & {
  feed_type: FeedType | null;
  pen: Pen | null;
  feeding_event_animals: Array<
    FeedingEventAnimal & {
      animal:
        | (Animal & {
            species: AnimalSpecies | null;
          })
        | null;
    }
  >;
};

type AllocationContext = {
  allocationId: string;
  animalId: string;
  tagNumber: string;
  animalStatus: AnimalStatus;
  speciesId: string | null;
  speciesName: string;
  speciesSlug: string | null;
  feedTypeId: string | null;
  feedTypeName: string;
  eventPenId: string | null;
  eventPenName: string | null;
  penId: string | null;
  penName: string;
  date: string;
  quantityKg: number;
  cost: number;
};

type AnimalAggregate = {
  animalId: string;
  tagNumber: string;
  speciesId: string | null;
  speciesName: string;
  speciesSlug: string | null;
  penId: string | null;
  penName: string;
  feedConsumedKg: number;
  feedCost: number;
};

function ratio(numerator: number, denominator: number | null | undefined) {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

function round(value: number | null, decimals = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function weightOnOrBefore(records: WeightRecord[], date: string) {
  return [...records]
    .filter((record) => record.recorded_at <= date)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
}

function groupByAnimalWeights(records: WeightRecord[]) {
  const grouped = new Map<string, WeightRecord[]>();

  for (const record of records) {
    const current = grouped.get(record.animal_id) ?? [];
    current.push(record);
    grouped.set(record.animal_id, current);
  }

  return grouped;
}

function classifyEfficiency(args: {
  speciesSlug: string | null;
  fcr: number | null;
  weightGainKg: number | null;
  feedCost: number;
  costPerKgGained: number | null;
  farmMedianCostPerKgGained: number | null;
}): FeedCostStatus {
  if (args.weightGainKg === null || args.fcr === null || args.costPerKgGained === null) {
    return args.feedCost > 0 && args.weightGainKg !== null && args.weightGainKg <= 0
      ? "Critical"
      : "Insufficient Data";
  }

  const maxFcr = speciesMaxFcr[args.speciesSlug ?? ""] ?? speciesMaxFcr.cattle;
  if (args.weightGainKg <= 0 || args.fcr >= maxFcr * 1.5) return "Critical";
  if (args.fcr > maxFcr) return "Poor";
  if (
    args.farmMedianCostPerKgGained !== null &&
    args.costPerKgGained > args.farmMedianCostPerKgGained * 1.35
  ) {
    return "Poor";
  }
  if (args.fcr <= maxFcr * 0.8) return "Excellent";

  return "Normal";
}

function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[midpoint];

  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function addBreakdown(
  map: Map<string, FeedCostBreakdownPoint>,
  key: string,
  name: string,
  cost: number,
  quantityKg: number,
) {
  const current = map.get(key) ?? { name, feedCost: 0, feedUsedKg: 0 };
  current.feedCost += cost;
  current.feedUsedKg += quantityKg;
  map.set(key, current);
}

function sortBreakdown(map: Map<string, FeedCostBreakdownPoint>) {
  return [...map.values()]
    .map((point) => ({
      ...point,
      feedCost: round(point.feedCost) ?? 0,
      feedUsedKg: round(point.feedUsedKg) ?? 0,
    }))
    .sort((a, b) => b.feedCost - a.feedCost);
}

function buildAnimalRows(
  allocations: AllocationContext[],
  weightsByAnimal: Map<string, WeightRecord[]>,
  filters: FeedCostAnalysisFilters,
) {
  const grouped = new Map<string, AnimalAggregate>();

  for (const allocation of allocations) {
    const current = grouped.get(allocation.animalId) ?? {
      animalId: allocation.animalId,
      tagNumber: allocation.tagNumber,
      speciesId: allocation.speciesId,
      speciesName: allocation.speciesName,
      speciesSlug: allocation.speciesSlug,
      penId: allocation.penId,
      penName: allocation.penName,
      feedConsumedKg: 0,
      feedCost: 0,
    };

    current.feedConsumedKg += allocation.quantityKg;
    current.feedCost += allocation.cost;
    grouped.set(allocation.animalId, current);
  }

  const preRows = [...grouped.values()].map((animal) => {
    const weights = weightsByAnimal.get(animal.animalId) ?? [];
    const startWeight = weightOnOrBefore(weights, filters.startDate);
    const endWeight = weightOnOrBefore(weights, filters.endDate);
    const startWeightKg = startWeight ? toNumber(startWeight.weight_kg) : null;
    const endWeightKg = endWeight ? toNumber(endWeight.weight_kg) : null;
    const rawGain =
      startWeightKg !== null && endWeightKg !== null ? endWeightKg - startWeightKg : null;
    const usableGain = rawGain !== null && rawGain > 0 ? rawGain : null;

    return {
      ...animal,
      startWeightKg,
      endWeightKg,
      weightGainedKg: rawGain,
      fcr: ratio(animal.feedConsumedKg, usableGain),
      costPerKgGained: ratio(animal.feedCost, usableGain),
    };
  });

  const farmMedianCostPerKgGained = median(
    preRows
      .map((row) => row.costPerKgGained)
      .filter((value): value is number => value !== null && Number.isFinite(value)),
  );

  return preRows
    .map<AnimalFeedCostRow>((row) => ({
      animalId: row.animalId,
      tagNumber: row.tagNumber,
      speciesId: row.speciesId,
      speciesName: row.speciesName,
      speciesSlug: row.speciesSlug,
      penId: row.penId,
      penName: row.penName,
      feedConsumedKg: round(row.feedConsumedKg) ?? 0,
      feedCost: round(row.feedCost) ?? 0,
      startWeightKg: round(row.startWeightKg),
      endWeightKg: round(row.endWeightKg),
      weightGainedKg: round(row.weightGainedKg),
      fcr: round(row.fcr),
      costPerKgGained: round(row.costPerKgGained),
      status: classifyEfficiency({
        speciesSlug: row.speciesSlug,
        fcr: row.fcr,
        weightGainKg: row.weightGainedKg,
        feedCost: row.feedCost,
        costPerKgGained: row.costPerKgGained,
        farmMedianCostPerKgGained,
      }),
    }))
    .sort((a, b) => b.feedCost - a.feedCost);
}

function buildFeedRows(allocations: AllocationContext[], animalRows: AnimalFeedCostRow[]) {
  const animalGainById = new Map(
    animalRows.map((row) => [
      row.animalId,
      row.weightGainedKg !== null && row.weightGainedKg > 0 ? row.weightGainedKg : null,
    ]),
  );
  const grouped = new Map<
    string,
    {
      feedTypeId: string | null;
      feedTypeName: string;
      totalUsedKg: number;
      totalCost: number;
      animalIds: Set<string>;
    }
  >();

  for (const allocation of allocations) {
    const key = allocation.feedTypeId ?? "unspecified";
    const current = grouped.get(key) ?? {
      feedTypeId: allocation.feedTypeId,
      feedTypeName: allocation.feedTypeName,
      totalUsedKg: 0,
      totalCost: 0,
      animalIds: new Set<string>(),
    };
    current.totalUsedKg += allocation.quantityKg;
    current.totalCost += allocation.cost;
    current.animalIds.add(allocation.animalId);
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map<FeedTypeEfficiencyRow>((row) => {
      const estimatedGain = [...row.animalIds].reduce(
        (total, animalId) => total + (animalGainById.get(animalId) ?? 0),
        0,
      );
      const usableGain = estimatedGain > 0 ? estimatedGain : null;
      const fcr = ratio(row.totalUsedKg, usableGain);

      return {
        feedTypeId: row.feedTypeId,
        feedTypeName: row.feedTypeName,
        totalUsedKg: round(row.totalUsedKg) ?? 0,
        totalCost: round(row.totalCost) ?? 0,
        animalsFed: row.animalIds.size,
        averageCostPerKgFeed: round(ratio(row.totalCost, row.totalUsedKg)),
        estimatedKgGained: round(usableGain),
        costPerKgGained: round(ratio(row.totalCost, usableGain)),
        status: usableGain
          ? fcr !== null && fcr <= 5
            ? "Excellent"
            : "Normal"
          : "Insufficient Data",
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);
}

function buildPenRows(animalRows: AnimalFeedCostRow[]) {
  const grouped = new Map<
    string,
    {
      penId: string | null;
      penName: string;
      speciesNames: Set<string>;
      animalIds: Set<string>;
      feedUsedKg: number;
      feedCost: number;
      totalWeightGainKg: number;
    }
  >();

  for (const animal of animalRows) {
    const key = animal.penId ?? "unassigned";
    const current = grouped.get(key) ?? {
      penId: animal.penId,
      penName: animal.penName,
      speciesNames: new Set<string>(),
      animalIds: new Set<string>(),
      feedUsedKg: 0,
      feedCost: 0,
      totalWeightGainKg: 0,
    };
    current.speciesNames.add(animal.speciesName);
    current.animalIds.add(animal.animalId);
    current.feedUsedKg += animal.feedConsumedKg;
    current.feedCost += animal.feedCost;
    if (animal.weightGainedKg !== null && animal.weightGainedKg > 0) {
      current.totalWeightGainKg += animal.weightGainedKg;
    }
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map<PenFeedCostRow>((row) => {
      const usableGain = row.totalWeightGainKg > 0 ? row.totalWeightGainKg : null;
      const fcr = ratio(row.feedUsedKg, usableGain);
      const costPerGain = ratio(row.feedCost, usableGain);

      return {
        penId: row.penId,
        penName: row.penName,
        speciesName: [...row.speciesNames].join(", "),
        animals: row.animalIds.size,
        feedUsedKg: round(row.feedUsedKg) ?? 0,
        feedCost: round(row.feedCost) ?? 0,
        totalWeightGainKg: round(usableGain),
        averageFcr: round(fcr),
        costPerKgGained: round(costPerGain),
        status:
          usableGain === null
            ? "Insufficient Data"
            : fcr !== null && fcr > speciesMaxFcr.cattle * 1.5
              ? "Critical"
              : fcr !== null && fcr > speciesMaxFcr.cattle
                ? "Poor"
                : "Normal",
      };
    })
    .sort((a, b) => b.feedCost - a.feedCost);
}

function buildInsights(args: {
  totalCost: number;
  feedRows: FeedTypeEfficiencyRow[];
  animalRows: AnimalFeedCostRow[];
  penRows: PenFeedCostRow[];
}): FeedCostInsight[] {
  const insights: FeedCostInsight[] = [];
  const topFeed = args.feedRows[0];
  const bestPen = args.penRows
    .filter((row) => row.costPerKgGained !== null)
    .sort((a, b) => (a.costPerKgGained ?? 0) - (b.costPerKgGained ?? 0))[0];
  const worstPen = args.penRows
    .filter((row) => row.costPerKgGained !== null)
    .sort((a, b) => (b.costPerKgGained ?? 0) - (a.costPerKgGained ?? 0))[0];
  const problemAnimal = args.animalRows.find((row) => ["Critical", "Poor"].includes(row.status));
  const insufficientAnimals = args.animalRows.filter((row) => row.status === "Insufficient Data");

  if (topFeed && args.totalCost > 0) {
    const share = (topFeed.totalCost / args.totalCost) * 100;
    insights.push({
      id: "largest-feed-driver",
      severity: share >= 60 ? "warning" : "info",
      title: "Largest feed cost driver",
      message: `${topFeed.feedTypeName} accounts for ${share.toFixed(0)}% of feed cost in this period.`,
    });
  }

  if (worstPen) {
    insights.push({
      id: "worst-pen",
      severity: "warning",
      title: "Worst pen efficiency",
      message: `${worstPen.penName} has the highest cost per kg gained at $${worstPen.costPerKgGained?.toFixed(2)}/kg.`,
    });
  }

  if (bestPen) {
    insights.push({
      id: "best-pen",
      severity: "success",
      title: "Best pen efficiency",
      message: `${bestPen.penName} is currently the best pen by feed cost per kg gained.`,
    });
  }

  if (problemAnimal) {
    insights.push({
      id: "problem-animal",
      severity: problemAnimal.status === "Critical" ? "danger" : "warning",
      title: "Animal needs review",
      message: `${problemAnimal.tagNumber} has ${problemAnimal.status.toLowerCase()} feed efficiency and should be inspected.`,
    });
  }

  if (insufficientAnimals.length > 0) {
    insights.push({
      id: "missing-weight-data",
      severity: "info",
      title: "Weight records needed",
      message: `${insufficientAnimals.length} fed animals do not have enough usable weight data for FCR and cost-of-gain analysis.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "no-data",
      severity: "info",
      title: "No cost issues found",
      message:
        "Record feed allocations and weight records to generate cost insights for this period.",
    });
  }

  return insights.slice(0, 6);
}

export const feedCostAnalysisService = {
  async getCostAnalysis(
    farmId: string,
    filters: FeedCostAnalysisFilters,
  ): Promise<FeedCostAnalysisResult> {
    let eventQuery = db
      .from("feeding_events")
      .select(
        `
          *,
          feed_type:feed_types(*),
          pen:pens(*),
          feeding_event_animals(
            *,
            animal:animals(
              *,
              species:animal_species!animals_species_id_fkey(*)
            )
          )
        `,
      )
      .eq("farm_id", farmId)
      .gte("feeding_date", filters.startDate)
      .lte("feeding_date", filters.endDate)
      .order("feeding_date", { ascending: true });

    if (filters.feedTypeId) eventQuery = eventQuery.eq("feed_type_id", filters.feedTypeId);

    const [
      { data: eventData, error: eventError },
      { data: assignmentData, error: assignmentError },
      { data: weightData, error: weightError },
    ] = await Promise.all([
      eventQuery,
      db
        .from("animal_pen_assignments")
        .select("*, pen:pens(*)")
        .eq("farm_id", farmId)
        .is("ended_at", null),
      db
        .from("weight_records")
        .select("*")
        .eq("farm_id", farmId)
        .lte("recorded_at", filters.endDate),
    ]);

    if (eventError) handleSupabaseError(eventError);
    if (assignmentError) handleSupabaseError(assignmentError);
    if (weightError) handleSupabaseError(weightError);

    const activeAssignments = new Map(
      ((assignmentData ?? []) as AnimalPenAssignment[]).map((assignment) => [
        assignment.animal_id,
        assignment,
      ]),
    );

    const allocations = ((eventData ?? []) as AnalysisEventRow[])
      .flatMap((event) =>
        (event.feeding_event_animals ?? []).map((allocation) => {
          const animal = allocation.animal;
          const activeAssignment = activeAssignments.get(allocation.animal_id);
          const resolvedPen = activeAssignment?.pen ?? event.pen ?? null;
          const speciesSlug = animal?.species?.slug ?? null;
          const speciesConfig = getSpeciesConfig(speciesSlug);

          return {
            allocationId: allocation.id,
            animalId: allocation.animal_id,
            tagNumber: animal?.tag_number ?? "Unknown animal",
            animalStatus: animal?.status ?? "active",
            speciesId: animal?.species_id ?? null,
            speciesName: animal?.species?.name ?? speciesConfig.label,
            speciesSlug,
            feedTypeId: event.feed_type_id,
            feedTypeName: event.feed_type?.name ?? "Unspecified feed",
            eventPenId: event.pen_id,
            eventPenName: event.pen?.name ?? null,
            penId: resolvedPen?.id ?? null,
            penName: resolvedPen?.name ?? "Unassigned",
            date: event.feeding_date,
            quantityKg: toNumber(allocation.allocated_quantity_kg),
            cost: toNumber(allocation.allocated_cost),
          } satisfies AllocationContext;
        }),
      )
      .filter((allocation) => {
        if (filters.speciesId && allocation.speciesId !== filters.speciesId) return false;
        if (filters.penId && allocation.penId !== filters.penId) return false;
        if (
          filters.animalStatus &&
          filters.animalStatus !== "all" &&
          allocation.animalStatus !== filters.animalStatus
        ) {
          return false;
        }
        return true;
      });

    const weightsByAnimal = groupByAnimalWeights((weightData ?? []) as WeightRecord[]);
    const animalRows = buildAnimalRows(allocations, weightsByAnimal, filters);
    const feedRows = buildFeedRows(allocations, animalRows);
    const penRows = buildPenRows(animalRows);

    const trend = new Map<string, FeedCostTrendPoint>();
    const byFeedType = new Map<string, FeedCostBreakdownPoint>();
    const bySpecies = new Map<string, FeedCostBreakdownPoint>();
    const byPen = new Map<string, FeedCostBreakdownPoint>();

    for (const allocation of allocations) {
      const day = trend.get(allocation.date) ?? {
        date: allocation.date,
        feedCost: 0,
        feedUsedKg: 0,
      };
      day.feedCost += allocation.cost;
      day.feedUsedKg += allocation.quantityKg;
      trend.set(allocation.date, day);

      addBreakdown(
        byFeedType,
        allocation.feedTypeId ?? "unspecified",
        allocation.feedTypeName,
        allocation.cost,
        allocation.quantityKg,
      );
      addBreakdown(
        bySpecies,
        allocation.speciesId ?? "unspecified",
        allocation.speciesName,
        allocation.cost,
        allocation.quantityKg,
      );
      addBreakdown(
        byPen,
        allocation.penId ?? "unassigned",
        allocation.penName,
        allocation.cost,
        allocation.quantityKg,
      );
    }

    const totalFeedCost = allocations.reduce((total, allocation) => total + allocation.cost, 0);
    const totalFeedUsedKg = allocations.reduce(
      (total, allocation) => total + allocation.quantityKg,
      0,
    );
    const totalUsableGain = animalRows.reduce(
      (total, animal) =>
        total +
        (animal.weightGainedKg !== null && animal.weightGainedKg > 0 ? animal.weightGainedKg : 0),
      0,
    );
    const mostExpensiveFeed = feedRows[0]?.feedTypeName ?? null;
    const worstPerformingPen =
      [...penRows]
        .filter((row) => row.costPerKgGained !== null)
        .sort((a, b) => (b.costPerKgGained ?? 0) - (a.costPerKgGained ?? 0))[0]?.penName ?? null;

    return {
      summary: {
        totalFeedCost: round(totalFeedCost) ?? 0,
        totalFeedUsedKg: round(totalFeedUsedKg) ?? 0,
        averageCostPerKgGained: round(ratio(totalFeedCost, totalUsableGain)),
        averageFcr: round(ratio(totalFeedUsedKg, totalUsableGain)),
        mostExpensiveFeed,
        worstPerformingPen,
      },
      trend: [...trend.values()]
        .map((point) => ({
          date: point.date,
          feedCost: round(point.feedCost) ?? 0,
          feedUsedKg: round(point.feedUsedKg) ?? 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      costByFeedType: sortBreakdown(byFeedType),
      costBySpecies: sortBreakdown(bySpecies),
      costByPen: sortBreakdown(byPen),
      feedEfficiencyRows: feedRows,
      animalRows,
      penRows,
      insights: buildInsights({
        totalCost: totalFeedCost,
        feedRows,
        animalRows,
        penRows,
      }),
    };
  },
};
