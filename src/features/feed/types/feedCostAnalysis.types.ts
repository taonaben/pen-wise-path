import type { AnimalStatus } from "@/features/animals/types/animal.types";

export type FeedCostStatus = "Excellent" | "Normal" | "Poor" | "Critical" | "Insufficient Data";

export type FeedCostAnalysisFilters = {
  startDate: string;
  endDate: string;
  speciesId?: string;
  feedTypeId?: string;
  penId?: string;
  animalStatus?: AnimalStatus | "all";
};

export type FeedCostAnalysisSummary = {
  totalFeedCost: number;
  totalFeedUsedKg: number;
  averageCostPerKgGained: number | null;
  averageFcr: number | null;
  mostExpensiveFeed: string | null;
  worstPerformingPen: string | null;
};

export type FeedCostTrendPoint = {
  date: string;
  feedCost: number;
  feedUsedKg: number;
};

export type FeedCostBreakdownPoint = {
  name: string;
  feedCost: number;
  feedUsedKg: number;
};

export type FeedTypeEfficiencyRow = {
  feedTypeId: string | null;
  feedTypeName: string;
  totalUsedKg: number;
  totalCost: number;
  animalsFed: number;
  averageCostPerKgFeed: number | null;
  estimatedKgGained: number | null;
  costPerKgGained: number | null;
  status: FeedCostStatus;
};

export type AnimalFeedCostRow = {
  animalId: string;
  tagNumber: string;
  speciesId: string | null;
  speciesName: string;
  speciesSlug: string | null;
  penId: string | null;
  penName: string;
  feedConsumedKg: number;
  feedCost: number;
  startWeightKg: number | null;
  endWeightKg: number | null;
  weightGainedKg: number | null;
  fcr: number | null;
  costPerKgGained: number | null;
  status: FeedCostStatus;
};

export type PenFeedCostRow = {
  penId: string | null;
  penName: string;
  speciesName: string;
  animals: number;
  feedUsedKg: number;
  feedCost: number;
  totalWeightGainKg: number | null;
  averageFcr: number | null;
  costPerKgGained: number | null;
  status: FeedCostStatus;
};

export type FeedCostInsight = {
  id: string;
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
};

export type FeedCostAnalysisResult = {
  summary: FeedCostAnalysisSummary;
  trend: FeedCostTrendPoint[];
  costByFeedType: FeedCostBreakdownPoint[];
  costBySpecies: FeedCostBreakdownPoint[];
  costByPen: FeedCostBreakdownPoint[];
  feedEfficiencyRows: FeedTypeEfficiencyRow[];
  animalRows: AnimalFeedCostRow[];
  penRows: PenFeedCostRow[];
  insights: FeedCostInsight[];
};
