import type { AlertRow, ConfidenceResult, FeedAllocationRow, MarketPriceRow, WeightRecordRow } from "./types.ts";

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculatePredictionConfidence(args: {
  weightRecords: WeightRecordRow[];
  feedAllocations: FeedAllocationRow[];
  marketPrices: MarketPriceRow[];
  severeAlerts: AlertRow[];
}): ConfidenceResult {
  let score = 1;
  const reasons: string[] = [];

  const latestWeight = [...args.weightRecords].sort((a, b) =>
    b.recorded_at.localeCompare(a.recorded_at),
  )[0];
  const latestWeightAge = daysSince(latestWeight?.recorded_at ?? null);

  if (args.weightRecords.length < 2) {
    score -= 0.3;
    reasons.push("not enough weight records");
  } else if (args.weightRecords.length < 5) {
    score -= 0.12;
    reasons.push("limited weight history");
  }

  if (latestWeightAge === null || latestWeightAge > 14) {
    score -= 0.18;
    reasons.push("latest weight is stale");
  } else if (latestWeightAge > 7) {
    score -= 0.08;
    reasons.push("latest weight is older than 7 days");
  }

  if (args.feedAllocations.length === 0) {
    score -= 0.22;
    reasons.push("missing feed history");
  }

  if (args.marketPrices.length === 0) {
    score -= 0.3;
    reasons.push("missing market price data");
  } else if (args.marketPrices.length < 3) {
    score -= 0.12;
    reasons.push("limited market price history");
  }

  if (args.severeAlerts.length > 0) {
    score -= 0.18;
    reasons.push("active severe growth alert");
  }

  const bounded = Math.max(0, Math.min(1, score));
  const label = bounded >= 0.75 ? "High" : bounded >= 0.45 ? "Medium" : "Low";

  return {
    score: bounded,
    label,
    reasons,
  };
}
