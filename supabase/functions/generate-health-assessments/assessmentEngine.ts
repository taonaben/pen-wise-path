import type {
  AlertRow,
  AnimalRow,
  AssessmentResult,
  FeedAllocationRow,
  HealthEventRow,
  WeightRecordRow,
} from "./types.ts";

const thresholdsBySpecies: Record<string, { lowAdg: number; highFcr: number }> = {
  cattle: { lowAdg: 0.2, highFcr: 9 },
  pigs: { lowAdg: 0.45, highFcr: 4 },
  goats: { lowAdg: 0.08, highFcr: 7 },
};

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function splitFeedsByRecentWindow(feedAllocations: FeedAllocationRow[]) {
  const today = new Date();
  const last7Cutoff = new Date(today);
  last7Cutoff.setUTCDate(last7Cutoff.getUTCDate() - 7);
  const previous7Cutoff = new Date(today);
  previous7Cutoff.setUTCDate(previous7Cutoff.getUTCDate() - 14);

  let last7 = 0;
  let previous7 = 0;

  for (const allocation of feedAllocations) {
    const feedingDate = allocation.feeding_event?.feeding_date;
    if (!feedingDate) continue;

    const date = new Date(`${feedingDate}T00:00:00Z`);
    if (date >= last7Cutoff) {
      last7 += toNumber(allocation.allocated_quantity_kg);
      continue;
    }

    if (date >= previous7Cutoff && date < last7Cutoff) {
      previous7 += toNumber(allocation.allocated_quantity_kg);
    }
  }

  return { last7, previous7 };
}

function buildSummary(status: AssessmentResult["health_status"], factors: string[]) {
  if (status === "healthy") {
    return "This animal currently appears stable based on available records. Continue normal monitoring.";
  }

  if (status === "watch") {
    return factors.length > 0
      ? `This animal needs closer observation: ${factors.join(", ")}.`
      : "This animal needs closer observation due to limited confidence signals.";
  }

  if (status === "at_risk") {
    return factors.length > 0
      ? `This animal is at risk based on: ${factors.join(", ")}.`
      : "This animal is at risk and requires timely inspection.";
  }

  return factors.length > 0
    ? `This animal is in critical risk status based on: ${factors.join(", ")}.`
    : "This animal is in critical risk status and requires urgent inspection.";
}

function buildRecommendedAction(status: AssessmentResult["health_status"]) {
  if (status === "healthy") return "Continue normal monitoring.";
  if (status === "watch") return "Inspect animal and update weight/feed records within 48 hours.";
  if (status === "at_risk") {
    return "Inspect animal today, review treatment status, and verify feed and growth records.";
  }

  return "Urgent inspection required. Escalate to farm manager and review treatment plan immediately.";
}

export function generateAnimalHealthAssessment(args: {
  animal: AnimalRow;
  weightRecords: WeightRecordRow[];
  feedAllocations: FeedAllocationRow[];
  healthEvents: HealthEventRow[];
  alerts: AlertRow[];
  todayIso: string;
}): AssessmentResult {
  const speciesSlug = args.animal.species?.slug ?? "cattle";
  const threshold = thresholdsBySpecies[speciesSlug] ?? thresholdsBySpecies.cattle;

  const sortedWeights = [...args.weightRecords].sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at),
  );
  const latestWeight = sortedWeights[sortedWeights.length - 1] ?? null;
  const previousWeight = sortedWeights.length > 1 ? sortedWeights[sortedWeights.length - 2] : null;

  const latestWeightValue = latestWeight
    ? toNumber(latestWeight.weight_kg)
    : toNumber(args.animal.purchase_weight_kg);
  const previousWeightValue = previousWeight ? toNumber(previousWeight.weight_kg) : null;

  const adg =
    sortedWeights.length >= 2
      ? (latestWeightValue - toNumber(sortedWeights[0].weight_kg)) /
        Math.max(
          daysBetween(sortedWeights[0].recorded_at, latestWeight?.recorded_at ?? args.todayIso),
          1,
        )
      : null;

  const weightGain = previousWeightValue === null ? null : latestWeightValue - previousWeightValue;

  const totalFeedKg = args.feedAllocations.reduce(
    (total, allocation) => total + toNumber(allocation.allocated_quantity_kg),
    0,
  );

  const totalWeightGain =
    sortedWeights.length >= 2 ? latestWeightValue - toNumber(sortedWeights[0].weight_kg) : null;

  const fcr = totalWeightGain && totalWeightGain > 0 ? totalFeedKg / totalWeightGain : null;

  const feedWindow = splitFeedsByRecentWindow(args.feedAllocations);
  const feedIntakeChangePercentage =
    feedWindow.previous7 > 0
      ? ((feedWindow.last7 - feedWindow.previous7) / feedWindow.previous7) * 100
      : 0;

  const openHealthEvents = args.healthEvents.filter((event) =>
    ["open", "monitoring", "under_treatment", "recovering"].includes(event.status),
  );
  const activeHealthEvents = openHealthEvents.length;

  const recentTreatmentCount = args.healthEvents.filter((event) => {
    if (!(event.treatment_given || event.treatment)) return false;
    const dateValue = event.observed_at ?? event.event_date;
    return daysBetween(dateValue, args.todayIso) <= 14;
  }).length;

  const criticalGrowthAlerts = args.alerts.filter(
    (alert) =>
      ["open", "reviewing"].includes(alert.status) &&
      ["high", "critical"].includes(alert.severity) &&
      ["NEGATIVE_GAIN", "LOW_ADG", "HIGH_FEED_LOW_GAIN", "POOR_FCR"].includes(alert.alert_type),
  ).length;

  const daysSinceLatestWeight = latestWeight
    ? daysBetween(latestWeight.recorded_at, args.todayIso)
    : null;

  let healthScore = 100;
  const factors: string[] = [];

  if (weightGain !== null && weightGain < 0) {
    healthScore -= 30;
    factors.push("negative weight gain");
  }

  if (adg !== null && adg < threshold.lowAdg) {
    healthScore -= 20;
    factors.push("low average daily gain");
  }

  if (fcr !== null && fcr > threshold.highFcr) {
    healthScore -= 15;
    factors.push("poor feed conversion efficiency");
  }

  if (feedIntakeChangePercentage <= -20) {
    healthScore -= 15;
    factors.push("feed intake drop");
  }

  if (activeHealthEvents > 0) {
    healthScore -= 20;
    factors.push("active health event");
  }

  if (recentTreatmentCount > 0) {
    healthScore -= 10;
    factors.push("recent treatment");
  }

  if (criticalGrowthAlerts > 0) {
    healthScore -= 30;
    factors.push("critical growth alerts");
  }

  if (daysSinceLatestWeight === null || daysSinceLatestWeight > 7) {
    healthScore -= 10;
    factors.push("missing recent weight record");
  }

  healthScore = clamp(Math.round(healthScore), 0, 100);

  let confidenceScore = 1;
  if (sortedWeights.length < 2) confidenceScore -= 0.3;
  if (daysSinceLatestWeight === null || daysSinceLatestWeight > 14) confidenceScore -= 0.25;
  if (args.feedAllocations.length === 0) confidenceScore -= 0.2;
  if (openHealthEvents.length === 0) confidenceScore -= 0.05;
  confidenceScore = clamp(Number(confidenceScore.toFixed(4)), 0, 1);

  const confidenceLabel =
    confidenceScore >= 0.75 ? "High" : confidenceScore >= 0.45 ? "Medium" : "Low";

  const healthStatus: AssessmentResult["health_status"] =
    healthScore >= 85
      ? "healthy"
      : healthScore >= 65
        ? "watch"
        : healthScore >= 40
          ? "at_risk"
          : "critical";

  const riskLevel: AssessmentResult["risk_level"] =
    healthStatus === "healthy"
      ? "low"
      : healthStatus === "watch"
        ? "medium"
        : healthStatus === "at_risk"
          ? "high"
          : "critical";

  const summary = buildSummary(healthStatus, factors);
  const recommendedAction = buildRecommendedAction(healthStatus);

  return {
    animal_id: args.animal.id,
    tag_number: args.animal.tag_number,
    health_status: healthStatus,
    health_score: healthScore,
    risk_level: riskLevel,
    confidence_score: confidenceScore,
    confidence_label: confidenceLabel,
    summary,
    recommended_action: recommendedAction,
    source: "rule_based",
    engine_version: "health-assessment-v1",
    signals: {
      recent_adg: adg,
      expected_adg: threshold.lowAdg,
      latest_weight_kg: latestWeightValue,
      previous_weight_kg: previousWeightValue,
      weight_gain_since_last_record: weightGain,
      days_since_latest_weight: daysSinceLatestWeight,
      total_feed_kg: Number(totalFeedKg.toFixed(2)),
      feed_intake_change_percentage: Number(feedIntakeChangePercentage.toFixed(2)),
      fcr,
      fcr_status: fcr !== null && fcr > threshold.highFcr ? "poor" : "ok",
      active_health_events: activeHealthEvents,
      recent_treatments: recentTreatmentCount,
      active_growth_alerts: criticalGrowthAlerts,
      triggered_factors: factors,
    },
  };
}
