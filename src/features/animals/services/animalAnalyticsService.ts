import { differenceInCalendarDays, parseISO } from "date-fns";
import { getSpeciesConfig } from "../config/speciesConfig";
import type {
  AnimalDetailMetrics,
  AnimalFeedAllocationViewModel,
  AnimalPerformance,
  AnimalProjection,
  AnimalViewModel,
  WeightRecord,
} from "../types/animal.types";

export function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateAverageDailyGain(records: WeightRecord[]): number | null {
  if (records.length < 2) return null;

  const sorted = [...records].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const days = differenceInCalendarDays(parseISO(latest.recorded_at), parseISO(first.recorded_at));

  if (days <= 0) return null;

  return (toNumber(latest.weight_kg) - toNumber(first.weight_kg)) / days;
}

export function classifyAnimalPerformance(
  adg: number | null | undefined,
  speciesSlug: string | null | undefined,
): AnimalPerformance {
  if (adg === null || adg === undefined || Number.isNaN(adg)) return "Unknown";
  if (adg < 0) return "Critical";

  const config = getSpeciesConfig(speciesSlug);
  if (adg < config.expectedAdgRange.poor) return "Underperforming";
  if (adg >= config.expectedAdgRange.excellent) return "Excellent";
  return "Normal";
}

export function getSellingRecommendation(
  currentWeightKg: number | null | undefined,
  adg: number | null | undefined,
  speciesSlug: string | null | undefined,
): string {
  if (!currentWeightKg) return "Record weight";

  const config = getSpeciesConfig(speciesSlug);
  const range = config.sellingWeightRangeKg;

  if (currentWeightKg >= range.max) return "Review for sale";
  if (currentWeightKg >= range.min) return "Ready for sale";
  if (!adg || adg <= 0) return "Inspect growth";

  const daysToIdeal = Math.ceil((range.ideal - currentWeightKg) / adg);
  if (daysToIdeal <= 0) return "Ready for sale";

  return `Sell in ${daysToIdeal} days`;
}

export function calculateAnimalDetailMetrics(
  animal: AnimalViewModel,
  weightRecords: WeightRecord[],
  feedAllocations: AnimalFeedAllocationViewModel[],
): AnimalDetailMetrics {
  const currentWeightKg = animal.currentWeightKg;
  const startingWeightKg = animal.purchaseWeightKg;
  const totalGainKg = Math.max((currentWeightKg ?? startingWeightKg) - startingWeightKg, 0);
  const averageDailyGainKg = calculateAverageDailyGain(weightRecords) ?? animal.averageDailyGainKg;
  const totalFeedConsumedKg = feedAllocations.reduce(
    (total, allocation) => total + allocation.allocatedQuantityKg,
    0,
  );
  const totalFeedCost = feedAllocations.reduce(
    (total, allocation) => total + allocation.allocatedCost,
    0,
  );

  return {
    currentWeightKg,
    startingWeightKg,
    totalGainKg,
    averageDailyGainKg,
    totalFeedConsumedKg,
    totalFeedCost,
    feedConversionRatio: totalGainKg > 0 ? totalFeedConsumedKg / totalGainKg : null,
    feedCostPerKgGained: totalGainKg > 0 ? totalFeedCost / totalGainKg : null,
    estimatedMargin: null,
  };
}

export function buildAnimalProjections(animal: AnimalViewModel): AnimalProjection[] {
  const days = [7, 14, 30];
  const currentWeight = animal.currentWeightKg;
  const adg = animal.averageDailyGainKg;

  return days.map((dayCount) => ({
    label: `${dayCount}-day`,
    days: dayCount,
    projectedWeightKg:
      currentWeight !== null && adg !== null ? currentWeight + adg * dayCount : null,
    projectedGainKg: adg !== null ? adg * dayCount : null,
  }));
}
