import { differenceInCalendarDays, parseISO } from "date-fns";
import { getSpeciesConfig } from "../config/speciesConfig";
import type { AnimalPerformance, WeightRecord } from "../types/animal.types";

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
