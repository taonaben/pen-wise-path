import { getSpeciesThreshold } from "./speciesThresholds.ts";
import type { AnimalGrowthMetrics, CandidateAlert } from "./types.ts";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function detectGrowthAlerts(args: {
  speciesSlug: string;
  tagNumber: string;
  metrics: AnimalGrowthMetrics;
}): CandidateAlert[] {
  const threshold = getSpeciesThreshold(args.speciesSlug);
  const alerts: CandidateAlert[] = [];

  const daysSince = args.metrics.daysSinceLatestWeight;
  if (daysSince !== null && daysSince > threshold.max_days_without_weight_record) {
    const severity = daysSince > 30 ? "high" : daysSince > 21 ? "medium" : "low";
    alerts.push({
      alert_type: "MISSING_WEIGHT_RECORD",
      severity,
      title: `Missing recent weight for ${args.tagNumber}`,
      message: `No weight record has been captured for ${daysSince} days.`,
      detected_metric: "days_since_weight_record",
      actual_value: daysSince,
      expected_value: threshold.max_days_without_weight_record,
      confidence: 0.96,
      source: "rule_based",
    });
  }

  if (
    args.metrics.latestWeightKg !== null &&
    args.metrics.previousWeightKg !== null &&
    args.metrics.latestWeightKg < args.metrics.previousWeightKg
  ) {
    const lossKg = args.metrics.previousWeightKg - args.metrics.latestWeightKg;
    alerts.push({
      alert_type: "NEGATIVE_GAIN",
      severity: lossKg >= threshold.critical_weight_loss_kg ? "critical" : "high",
      title: `Negative weight gain detected for ${args.tagNumber}`,
      message: `${args.tagNumber} lost ${lossKg.toFixed(2)} kg since the previous record.`,
      detected_metric: "weight_change_kg",
      actual_value: round(-lossKg),
      expected_value: 0,
      confidence: 0.97,
      source: "rule_based",
    });
  }

  if (args.metrics.recentAdgKgPerDay !== null && args.metrics.recentAdgKgPerDay < threshold.min_expected_adg_kg_per_day) {
    const severity = args.metrics.recentAdgKgPerDay <= 0 ? "critical" : "high";
    alerts.push({
      alert_type: "LOW_ADG",
      severity,
      title: `Low daily gain detected for ${args.tagNumber}`,
      message: `${args.tagNumber} recent ADG is ${args.metrics.recentAdgKgPerDay.toFixed(3)} kg/day, below the expected ${threshold.min_expected_adg_kg_per_day.toFixed(3)} kg/day.`,
      detected_metric: "adg_kg_per_day",
      actual_value: round(args.metrics.recentAdgKgPerDay),
      expected_value: threshold.min_expected_adg_kg_per_day,
      confidence: 0.93,
      source: "statistical",
    });
  }

  return alerts;
}
