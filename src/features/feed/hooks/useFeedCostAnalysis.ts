import { useQuery } from "@tanstack/react-query";
import { feedCostAnalysisService } from "../services/feedCostAnalysisService";
import type { FeedCostAnalysisFilters } from "../types/feedCostAnalysis.types";

export const feedCostAnalysisKeys = {
  all: ["feed-cost-analysis"] as const,
  detail: (farmId: string | undefined, filters: FeedCostAnalysisFilters) =>
    [...feedCostAnalysisKeys.all, farmId ?? "no-farm", filters] as const,
};

export function getDefaultFeedCostAnalysisFilters(): FeedCostAnalysisFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    animalStatus: "all",
  };
}

export function useFeedCostAnalysis(farmId: string | undefined, filters: FeedCostAnalysisFilters) {
  return useQuery({
    queryKey: feedCostAnalysisKeys.detail(farmId, filters),
    queryFn: () => feedCostAnalysisService.getCostAnalysis(farmId!, filters),
    enabled: Boolean(farmId && filters.startDate && filters.endDate),
  });
}
