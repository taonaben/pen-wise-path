import { startOfWeek } from "date-fns";
import type {
  MarketInsight,
  MarketPriceViewModel,
  MarketStats,
  MarketTrendPoint,
  MarketTrendResult,
} from "../types/market.types";

function round(value: number | null, decimals = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function thisMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function weekKey(dateIso: string) {
  return startOfWeek(new Date(`${dateIso}T00:00:00`), { weekStartsOn: 1 })
    .toISOString()
    .slice(0, 10);
}

function buildTrend(records: MarketPriceViewModel[]): MarketTrendPoint[] {
  const grouped = new Map<string, MarketPriceViewModel[]>();

  for (const record of records) {
    const key = weekKey(record.recordedAt);
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }

  return [...grouped.entries()]
    .map(([week, rows]) => {
      const prices = rows.map((row) => row.pricePerKg);
      return {
        week,
        averagePrice: round(average(prices)) ?? 0,
        highPrice: Math.max(...prices),
        lowPrice: Math.min(...prices),
        records: rows.length,
      };
    })
    .sort((a, b) => a.week.localeCompare(b.week));
}

function sourceAverage(records: MarketPriceViewModel[], sorter: "highest" | "lowest") {
  const grouped = new Map<string, number[]>();
  for (const record of records) {
    grouped.set(record.sourceName, [...(grouped.get(record.sourceName) ?? []), record.pricePerKg]);
  }

  return [...grouped.entries()]
    .map(([sourceName, prices]) => ({
      sourceName,
      averagePrice: average(prices) ?? 0,
    }))
    .sort((a, b) =>
      sorter === "highest" ? b.averagePrice - a.averagePrice : a.averagePrice - b.averagePrice,
    )[0];
}

function buildStats(records: MarketPriceViewModel[]): MarketStats {
  const sorted = [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const latest = [...records].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
  const earliest = sorted[0] ?? null;
  const highest = sourceAverage(records, "highest");
  const lowest = sourceAverage(records, "lowest");
  const averagePrice = round(average(records.map((record) => record.pricePerKg)));

  let priceChangePercent: number | null = null;
  if (latest && earliest && earliest.pricePerKg > 0 && latest.id !== earliest.id) {
    priceChangePercent = ((latest.pricePerKg - earliest.pricePerKg) / earliest.pricePerKg) * 100;
  }

  return {
    latestPrice: latest,
    averagePrice,
    highestSource: highest?.sourceName ?? null,
    lowestSource: lowest?.sourceName ?? null,
    priceChangePercent: round(priceChangePercent),
    recordsThisMonth: records.filter((record) => record.recordedAt >= thisMonthIso()).length,
  };
}

function buildInsights(records: MarketPriceViewModel[], stats: MarketStats): MarketInsight[] {
  const insights: MarketInsight[] = [];
  const speciesName = stats.latestPrice?.speciesName ?? "Market";

  if (stats.priceChangePercent !== null) {
    const direction = stats.priceChangePercent >= 0 ? "up" : "down";
    insights.push({
      id: "price-change",
      severity: stats.priceChangePercent >= 0 ? "success" : "warning",
      title: "Price trend",
      message: `${speciesName} prices are ${direction} ${Math.abs(stats.priceChangePercent).toFixed(1)}% in the selected period.`,
    });
  }

  if (stats.highestSource && stats.averagePrice !== null) {
    const highest = sourceAverage(records, "highest");
    if (highest && highest.averagePrice > stats.averagePrice) {
      const difference = ((highest.averagePrice - stats.averagePrice) / stats.averagePrice) * 100;
      insights.push({
        id: "best-source",
        severity: "success",
        title: "Best source",
        message: `${highest.sourceName} is offering ${difference.toFixed(1)}% above the filtered average.`,
      });
    }
  }

  const latestDate = stats.latestPrice?.recordedAt;
  if (latestDate) {
    const days = Math.floor(
      (Date.now() - new Date(`${latestDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days >= 21) {
      insights.push({
        id: "stale-price",
        severity: "warning",
        title: "Price is getting stale",
        message: `No matching market price has been recorded in ${days} days.`,
      });
    }
  }

  if (records.length === 0) {
    insights.push({
      id: "no-records",
      severity: "info",
      title: "No market records",
      message: "Add market prices to power selling predictions and trend recommendations.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "stable-market",
      severity: "info",
      title: "Stable market",
      message: "Prices are stable in the selected period.",
    });
  }

  return insights.slice(0, 5);
}

export const marketTrendService = {
  getMarketPriceTrend(records: MarketPriceViewModel[]): MarketTrendResult {
    const stats = buildStats(records);
    return {
      stats,
      trend: buildTrend(records),
      insights: buildInsights(records, stats),
    };
  },
};
