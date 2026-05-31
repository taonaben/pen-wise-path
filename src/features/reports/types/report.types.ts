import type { AnimalSpecies, AnimalStatus, Pen } from "@/features/animals/types/animal.types";

export type ReportDatePreset = "7" | "30" | "90" | "month" | "custom";

export type ReportFilters = {
  startDate: string;
  endDate: string;
  speciesId?: string;
  penId?: string;
  animalStatus: AnimalStatus | "all";
};

export type ReportFilterOptions = {
  species: AnimalSpecies[];
  pens: Pen[];
};

export type InsightSeverity = "info" | "success" | "warning" | "danger";

export type ReportInsight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  detail: string;
};

export type ReportSummaryItem = {
  id: string;
  title: string;
  value: string;
  description?: string;
  trend?: string;
  variant?: "default" | "success" | "warning" | "danger";
};

export type AnimalPerformanceRow = {
  animalId: string;
  tagNumber: string;
  speciesName: string;
  speciesSlug: string;
  penId: string | null;
  penName: string;
  status: AnimalStatus;
  startWeightKg: number;
  currentWeightKg: number;
  totalGainKg: number;
  adgKgPerDay: number | null;
  expectedAdgKgPerDay: number;
  healthStatus: string;
  growthStatus: string;
  recommendation: string;
  activeAlerts: number;
};

export type PerformanceAdgTrendPoint = {
  date: string;
  averageAdgKgPerDay: number;
};

export type PerformanceBreakdownPoint = {
  name: string;
  value: number;
};

export type PerformanceReportData = {
  filters: ReportFilters;
  summary: {
    totalActiveAnimals: number;
    averageDailyGainKgPerDay: number | null;
    averageCurrentWeightKg: number | null;
    totalWeightGainedKg: number;
    underperformingAnimals: number;
    negativeGainAnimals: number;
    readyForSaleAnimals: number;
  };
  adgTrend: PerformanceAdgTrendPoint[];
  gainBySpecies: PerformanceBreakdownPoint[];
  underperformingByPen: PerformanceBreakdownPoint[];
  performanceCategories: PerformanceBreakdownPoint[];
  topPerformers: AnimalPerformanceRow[];
  animalRows: AnimalPerformanceRow[];
  underperformingRows: AnimalPerformanceRow[];
  insights: ReportInsight[];
};

export type ProfitabilityReportData = {
  filters: ReportFilters;
  summary: {
    totalRevenue: number;
    totalProfit: number;
    averageProfitPerAnimal: number | null;
    averageProfitMargin: number | null;
    bestSaleAmount: number | null;
    worstSaleAmount: number | null;
    unsoldProjectedProfit: number | null;
    predictionAccuracyRate: number | null;
  };
  trend: Array<{ period: string; revenue: number; profit: number }>;
  profitBySpecies: PerformanceBreakdownPoint[];
  profitByBuyer: PerformanceBreakdownPoint[];
  soldRows: Array<{
    saleId: string;
    tagNumber: string;
    speciesName: string;
    soldAt: string;
    saleWeightKg: number;
    revenue: number;
    purchaseCost: number;
    feedCost: number;
    otherCost: number;
    netProfit: number;
    margin: number | null;
    normalizedBasis: "live_weight_equivalent" | "estimated_live_weight_equivalent";
  }>;
  predictionRows: Array<{
    saleId: string;
    tagNumber: string;
    predictedSellWindow: string;
    actualSaleDate: string;
    predictedProfit: number | null;
    actualProfit: number;
    difference: number | null;
    accuracyStatus: string;
  }>;
  insights: ReportInsight[];
};
