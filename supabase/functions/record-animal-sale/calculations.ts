import type {
  MarketPriceRow,
  ParsedSalePayload,
  PredictionAccuracy,
  PredictionRow,
  SaleCalculation,
} from "./types.ts";

export function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function comparePrediction(args: {
  prediction: PredictionRow | null;
  soldAt: string;
  saleWeightKg: number;
  netProfit: number;
}): PredictionAccuracy {
  if (!args.prediction) return "not_linked";

  const predictedWeight = toNumber(args.prediction.predicted_weight_kg, NaN);
  const predictedProfit = toNumber(args.prediction.expected_profit, NaN);
  const hasWeight = Number.isFinite(predictedWeight);
  const hasProfit = Number.isFinite(predictedProfit);

  if (!hasWeight && !hasProfit) return "not_linked";

  const weightDelta = hasWeight ? args.saleWeightKg - predictedWeight : 0;
  const profitDelta = hasProfit ? args.netProfit - predictedProfit : 0;
  const weightTolerance = hasWeight ? Math.max(5, predictedWeight * 0.05) : 0;
  const profitTolerance = hasProfit ? Math.max(25, Math.abs(predictedProfit) * 0.1) : 0;

  if (
    (!hasWeight || Math.abs(weightDelta) <= weightTolerance) &&
    (!hasProfit || Math.abs(profitDelta) <= profitTolerance)
  ) {
    return "close";
  }

  if (hasProfit && profitDelta < -profitTolerance) return "overestimated";
  if (hasProfit && profitDelta > profitTolerance) return "underestimated";
  if (hasWeight && weightDelta < -weightTolerance) return "overestimated";
  if (hasWeight && weightDelta > weightTolerance) return "underestimated";

  return "accurate";
}

export function calculateSale(args: {
  payload: ParsedSalePayload;
  purchaseCost: number;
  feedCost: number;
  latestMarketPrice: MarketPriceRow | null;
  prediction: PredictionRow | null;
}): SaleCalculation {
  const saleWeightKg = args.payload.saleWeightKg ?? 0;
  const pricePerKg = args.payload.pricePerKg ?? 0;
  const grossAmount =
    args.payload.priceBasis === "per_head"
      ? roundMoney(toNumber(args.payload.grossAmount))
      : roundMoney(saleWeightKg * pricePerKg);

  const purchaseCost = roundMoney(args.purchaseCost);
  const feedCost = roundMoney(args.feedCost);
  const healthCost = roundMoney(args.payload.healthCost);
  const otherCost = roundMoney(args.payload.otherCost);
  const totalCost = roundMoney(purchaseCost + feedCost + healthCost + otherCost);
  const netProfit = roundMoney(grossAmount - totalCost);
  const margin = grossAmount > 0 ? roundPercent((netProfit / grossAmount) * 100) : null;

  const marketPrice = args.latestMarketPrice
    ? toNumber(args.latestMarketPrice.price_per_kg, NaN)
    : NaN;
  const marketComparisonPercentage =
    Number.isFinite(marketPrice) && marketPrice > 0
      ? roundPercent(((pricePerKg - marketPrice) / marketPrice) * 100)
      : null;

  const predictionAccuracy = comparePrediction({
    prediction: args.prediction,
    soldAt: args.payload.soldAt ?? "",
    saleWeightKg,
    netProfit,
  });

  return {
    grossAmount,
    purchaseCost,
    feedCost,
    healthCost,
    otherCost,
    totalCost,
    netProfit,
    margin,
    marketComparisonPercentage,
    predictionAccuracy,
    metadata: {
      market_comparison: args.latestMarketPrice
        ? {
            market_price_id: args.latestMarketPrice.id,
            market_price_per_kg: marketPrice,
            actual_price_per_kg: pricePerKg,
            difference_percentage: marketComparisonPercentage,
          }
        : { status: "not_linked" },
      prediction_comparison: args.prediction
        ? {
            prediction_id: args.prediction.id,
            predicted_sell_date: args.prediction.best_sell_date,
            predicted_weight_kg: args.prediction.predicted_weight_kg,
            actual_weight_kg: saleWeightKg,
            predicted_profit: args.prediction.expected_profit,
            actual_profit: netProfit,
            accuracy: predictionAccuracy,
          }
        : { status: "not_linked" },
    },
  };
}
