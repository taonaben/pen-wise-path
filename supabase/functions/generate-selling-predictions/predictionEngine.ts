import { calculatePredictionConfidence } from "./confidence.ts";
import { selectPredictedMarketPrice } from "./marketTrend.ts";
import type {
  AlertRow,
  AnimalPredictionResult,
  AnimalRow,
  FeedAllocationRow,
  MarketPriceMethod,
  MarketPriceRow,
  PredictionWindow,
  WeightRecordRow,
} from "./types.ts";

const speciesSellingConfig: Record<string, { min: number; ideal: number; max: number }> = {
  cattle: { min: 350, ideal: 450, max: 550 },
  pigs: { min: 70, ideal: 100, max: 130 },
  goats: { min: 25, ideal: 40, max: 60 },
};

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number | null, decimals = 2): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function latestWeight(records: WeightRecordRow[], fallbackWeight: number) {
  const latest = [...records].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  return latest ? toNumber(latest.weight_kg) : fallbackWeight;
}

function calculateAdg(records: WeightRecordRow[]): number | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const days = daysBetween(first.recorded_at, latest.recorded_at);
  if (days <= 0) return null;
  return (toNumber(latest.weight_kg) - toNumber(first.weight_kg)) / days;
}

function feedCostToDate(feedAllocations: FeedAllocationRow[]) {
  return feedAllocations.reduce((sum, row) => sum + toNumber(row.allocated_cost), 0);
}

function averageDailyFeedCost(feedAllocations: FeedAllocationRow[], purchaseDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const recent = feedAllocations.filter((row) => (row.feeding_event?.feeding_date ?? "") >= cutoffIso);
  if (recent.length > 0) {
    return feedCostToDate(recent) / 30;
  }

  const lifetimeDays = Math.max(daysBetween(purchaseDate, today), 1);
  return feedCostToDate(feedAllocations) / lifetimeDays;
}

function buildWindows(args: {
  windows: number[];
  currentWeightKg: number;
  adgKgPerDay: number | null;
  predictedPrice: number | null;
  purchasePrice: number;
  feedCostToDate: number;
  averageDailyFeedCost: number;
}): PredictionWindow[] {
  const currentProfitBaseline = args.predictedPrice === null
    ? null
    : args.currentWeightKg * args.predictedPrice - args.purchasePrice - args.feedCostToDate;

  return args.windows.map((days) => {
    const predictedWeight = args.currentWeightKg + Math.max(args.adgKgPerDay ?? 0, 0) * days;
    const futureFeedCost = args.averageDailyFeedCost * days;
    const expectedRevenue =
      args.predictedPrice === null ? null : predictedWeight * args.predictedPrice;
    const expectedTotalCost = args.purchasePrice + args.feedCostToDate + futureFeedCost;
    const expectedProfit = expectedRevenue === null ? null : expectedRevenue - expectedTotalCost;

    return {
      days,
      predicted_weight: round(predictedWeight) ?? predictedWeight,
      predicted_price: round(args.predictedPrice),
      future_feed_cost: round(futureFeedCost) ?? 0,
      expected_revenue: round(expectedRevenue),
      expected_total_cost: round(expectedTotalCost) ?? 0,
      expected_profit: round(expectedProfit),
      profit_change:
        expectedProfit === null || currentProfitBaseline === null
          ? null
          : round(expectedProfit - currentProfitBaseline),
    };
  });
}

function chooseBestWindow(windows: PredictionWindow[]) {
  return [...windows]
    .filter((window) => window.expected_profit !== null)
    .sort((a, b) => (b.expected_profit ?? -Infinity) - (a.expected_profit ?? -Infinity))[0] ?? windows[0];
}

function recommendationFor(args: {
  bestWindow: PredictionWindow;
  windows: PredictionWindow[];
  currentWeightKg: number;
  adgKgPerDay: number | null;
  speciesSlug: string;
  severeAlerts: AlertRow[];
  confidenceLabel: string;
}) {
  const config = speciesSellingConfig[args.speciesSlug] ?? speciesSellingConfig.cattle;
  const now = args.windows.find((window) => window.days === 0) ?? args.windows[0];
  const nowProfit = now.expected_profit ?? null;
  const bestProfit = args.bestWindow.expected_profit ?? null;
  const profitGap =
    nowProfit !== null && bestProfit !== null ? Math.max(bestProfit - nowProfit, 0) : null;

  if (args.severeAlerts.length > 0 || (args.adgKgPerDay !== null && args.adgKgPerDay < 0)) {
    return "INSPECT_BEFORE_SELLING" as const;
  }

  if (args.confidenceLabel === "Low") {
    return "WATCH" as const;
  }

  if (args.currentWeightKg < config.min && args.bestWindow.days > 0) {
    return "NOT_READY" as const;
  }

  if (
    args.bestWindow.days === 0 ||
    (profitGap !== null && bestProfit !== null && profitGap <= Math.max(bestProfit * 0.05, 10) && args.currentWeightKg >= config.min)
  ) {
    return "SELL_NOW" as const;
  }

  if (args.bestWindow.days > 0) {
    return "HOLD" as const;
  }

  return "WATCH" as const;
}

function explanationFor(recommendation: string, bestWindow: PredictionWindow, confidenceReasons: string[]) {
  if (recommendation === "INSPECT_BEFORE_SELLING") {
    return "Inspect before selling because growth or alert data indicates elevated risk.";
  }
  if (recommendation === "SELL_NOW") {
    return "Sell now because current profit is close to or better than projected future profit.";
  }
  if (recommendation === "HOLD") {
    return `Hold for ${bestWindow.days} days because projected profit is highest in that window.`;
  }
  if (recommendation === "NOT_READY") {
    return `Not ready because the animal is below the species target range and future profit still improves.`;
  }
  return `Watch closely because prediction confidence is limited${confidenceReasons.length ? `: ${confidenceReasons.join(", ")}` : "."}`;
}

export function generateAnimalPrediction(args: {
  farmId: string;
  animal: AnimalRow;
  weights: WeightRecordRow[];
  feedAllocations: FeedAllocationRow[];
  marketPrices: MarketPriceRow[];
  severeAlerts: AlertRow[];
  windows: number[];
  marketPriceMethod: MarketPriceMethod;
}): AnimalPredictionResult {
  const speciesSlug = args.animal.species?.slug ?? "cattle";
  const purchaseWeightKg = toNumber(args.animal.purchase_weight_kg);
  const purchasePrice = toNumber(args.animal.purchase_price);
  const currentWeightKg = latestWeight(args.weights, purchaseWeightKg);
  const adgKgPerDay = calculateAdg(args.weights);
  const totalFeedCost = feedCostToDate(args.feedAllocations);
  const dailyFeedCost = averageDailyFeedCost(args.feedAllocations, args.animal.purchase_date);
  const market = selectPredictedMarketPrice(args.marketPrices, args.marketPriceMethod);
  const confidence = calculatePredictionConfidence({
    weightRecords: args.weights,
    feedAllocations: args.feedAllocations,
    marketPrices: args.marketPrices,
    severeAlerts: args.severeAlerts,
  });
  const windows = buildWindows({
    windows: args.windows,
    currentWeightKg,
    adgKgPerDay,
    predictedPrice: market.price,
    purchasePrice,
    feedCostToDate: totalFeedCost,
    averageDailyFeedCost: dailyFeedCost,
  });
  const bestWindow = chooseBestWindow(windows);
  const recommendation = recommendationFor({
    bestWindow,
    windows,
    currentWeightKg,
    adgKgPerDay,
    speciesSlug,
    severeAlerts: args.severeAlerts,
    confidenceLabel: confidence.label,
  });

  return {
    farm_id: args.farmId,
    animal_id: args.animal.id,
    species_id: args.animal.species_id,
    tag_number: args.animal.tag_number,
    current_weight_kg: round(currentWeightKg),
    average_daily_gain_kg: round(adgKgPerDay, 4),
    current_market_price: round(market.price),
    best_window_days: bestWindow.days,
    best_sell_date: addDays(bestWindow.days),
    predicted_weight_kg: round(bestWindow.predicted_weight),
    expected_revenue: bestWindow.expected_revenue,
    expected_total_cost: bestWindow.expected_total_cost,
    expected_profit: bestWindow.expected_profit,
    recommendation,
    confidence_score: round(confidence.score, 4) ?? 0,
    confidence_label: confidence.label,
    explanation: explanationFor(recommendation, bestWindow, confidence.reasons),
    metadata: {
      windows,
      confidence_reasons: confidence.reasons,
      market_price_method: market.method,
      market_price_records_used: market.recordsUsed,
      feed_cost_to_date: round(totalFeedCost),
      average_daily_feed_cost: round(dailyFeedCost),
      species_slug: speciesSlug,
      severe_alerts: args.severeAlerts.map((alert) => ({
        alert_type: alert.alert_type,
        severity: alert.severity,
      })),
    },
  };
}
