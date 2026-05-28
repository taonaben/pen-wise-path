import type { AnimalGrowthMetrics, FeedAllocationRow, WeightRecordRow } from "./types.ts";

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return 0;
  }

  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function daysSince(dateIso: string): number {
  const nowIso = new Date().toISOString();
  return daysBetween(dateIso, nowIso);
}

export function calculateAnimalGrowthMetrics(args: {
  weightRecords: WeightRecordRow[];
  feedAllocations: FeedAllocationRow[];
  lookbackDays: number;
}): AnimalGrowthMetrics {
  const weights = [...args.weightRecords].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const latest = weights.length > 0 ? weights[weights.length - 1] : null;
  const previous = weights.length > 1 ? weights[weights.length - 2] : null;

  const windowStart = new Date();
  windowStart.setUTCDate(windowStart.getUTCDate() - args.lookbackDays);
  const windowStartIso = windowStart.toISOString().slice(0, 10);

  const recentWeights = weights.filter((record) => record.recorded_at >= windowStartIso);
  const recentFirst = recentWeights.length > 0 ? recentWeights[0] : null;
  const recentLast = recentWeights.length > 1 ? recentWeights[recentWeights.length - 1] : null;

  let recentAdgKgPerDay: number | null = null;
  if (recentFirst && recentLast && recentFirst !== recentLast) {
    const days = Math.max(daysBetween(recentFirst.recorded_at, recentLast.recorded_at), 0);
    if (days > 0) {
      recentAdgKgPerDay = (toNumber(recentLast.weight_kg) - toNumber(recentFirst.weight_kg)) / days;
    }
  }

  const totalFeedQuantityKg = args.feedAllocations.reduce(
    (sum, allocation) => sum + toNumber(allocation.allocated_quantity_kg),
    0,
  );

  const totalFeedCost = args.feedAllocations.reduce(
    (sum, allocation) => sum + toNumber(allocation.allocated_cost),
    0,
  );

  return {
    latestWeightKg: latest ? toNumber(latest.weight_kg) : null,
    previousWeightKg: previous ? toNumber(previous.weight_kg) : null,
    recentAdgKgPerDay,
    daysSinceLatestWeight: latest ? daysSince(latest.recorded_at) : null,
    totalFeedQuantityKg,
    totalFeedCost,
  };
}
