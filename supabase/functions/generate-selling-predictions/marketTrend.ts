import type { MarketPriceMethod, MarketPriceRow } from "./types.ts";

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function selectPredictedMarketPrice(
  rows: MarketPriceRow[],
  method: MarketPriceMethod,
): { price: number | null; recordsUsed: number; method: MarketPriceMethod } {
  const prices = [...rows]
    .filter((row) => row.price_basis === "live_weight" || !row.price_basis)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  if (prices.length === 0) {
    return { price: null, recordsUsed: 0, method };
  }

  const limit = method === "average_last_5" ? 5 : method === "average_last_3" ? 3 : 1;
  const selected = prices.slice(0, limit);
  const average =
    selected.reduce((sum, row) => sum + toNumber(row.price_per_kg), 0) / selected.length;

  return {
    price: average,
    recordsUsed: selected.length,
    method,
  };
}
