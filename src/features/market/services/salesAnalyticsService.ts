import {
  BuyerPerformanceRow,
  SalesAnalyticsResult,
  SalesRecordViewModel,
  SalesSummary,
  SalesTrendPoint,
} from "../types/sales.types";

function weekKey(dateText: string) {
  const date = new Date(`${dateText}T00:00:00`);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function completed(rows: SalesRecordViewModel[]) {
  return rows.filter((row) => row.saleStatus !== "voided" && row.saleStatus !== "cancelled");
}

function calculateSummary(rows: SalesRecordViewModel[]): SalesSummary {
  const sales = completed(rows);
  const totalRevenue = sales.reduce((sum, row) => sum + row.grossAmount, 0);
  const totalWeight = sales.reduce((sum, row) => sum + row.saleWeightKg, 0);
  const totalProfit = sales.reduce((sum, row) => sum + row.netProfit, 0);

  return {
    totalRevenue: round(totalRevenue),
    animalsSold: sales.length,
    averagePricePerKg: totalWeight > 0 ? round(totalRevenue / totalWeight) : null,
    averageProfitPerAnimal: sales.length > 0 ? round(totalProfit / sales.length) : null,
    bestSale: sales.length
      ? [...sales].sort((a, b) => b.netProfit - a.netProfit)[0]
      : null,
    lossMakingSales: sales.filter((row) => row.netProfit < 0).length,
  };
}

function calculateRevenueTrend(rows: SalesRecordViewModel[]): SalesTrendPoint[] {
  const grouped = new Map<string, SalesTrendPoint>();

  for (const row of completed(rows)) {
    const key = weekKey(row.soldAt);
    const current = grouped.get(key) ?? { week: key, revenue: 0, profit: 0, sales: 0 };
    current.revenue += row.grossAmount;
    current.profit += row.netProfit;
    current.sales += 1;
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((item) => ({ ...item, revenue: round(item.revenue), profit: round(item.profit) }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function calculateBuyerPerformance(rows: SalesRecordViewModel[]): BuyerPerformanceRow[] {
  const grouped = new Map<string, { weight: number; revenue: number; count: number }>();

  for (const row of completed(rows)) {
    const key = row.buyerName || "Unspecified buyer";
    const current = grouped.get(key) ?? { weight: 0, revenue: 0, count: 0 };
    current.weight += row.saleWeightKg;
    current.revenue += row.grossAmount;
    current.count += 1;
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([buyerName, value]) => ({
      buyerName,
      animalsBought: value.count,
      averagePricePerKg: value.weight > 0 ? round(value.revenue / value.weight) : 0,
      totalRevenue: round(value.revenue),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export const salesAnalyticsService = {
  getSalesAnalytics(rows: SalesRecordViewModel[]): SalesAnalyticsResult {
    return {
      summary: calculateSummary(rows),
      trend: calculateRevenueTrend(rows),
      buyerPerformance: calculateBuyerPerformance(rows),
    };
  },
};
