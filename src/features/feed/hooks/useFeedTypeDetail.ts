import { useQuery } from "@tanstack/react-query";
import { feedBatchService } from "../services/feedBatchService";
import { feedInventoryService } from "../services/feedInventoryService";
import { feedMovementService } from "../services/feedMovementService";
import { feedTypeService } from "../services/feedTypeService";

export const feedTypeDetailKeys = {
  all: ["feed-type-detail"] as const,
  byId: (farmId: string | undefined, feedTypeId: string | undefined) =>
    [...feedTypeDetailKeys.all, farmId ?? "no-farm", feedTypeId ?? "no-feed-type"] as const,
};

export function useFeedTypeDetail(farmId: string | undefined, feedTypeId: string | undefined) {
  return useQuery({
    queryKey: feedTypeDetailKeys.byId(farmId, feedTypeId),
    queryFn: async () => {
      const [feedType, batches, movements, inventoryRows] = await Promise.all([
        feedTypeService.getById(farmId!, feedTypeId!),
        feedBatchService.listByFeedType(farmId!, feedTypeId!),
        feedMovementService.listByFeedType(farmId!, feedTypeId!),
        feedInventoryService.getFeedTypeInventorySummary(farmId!),
      ]);

      return {
        feedType,
        batches,
        movements,
        summary: inventoryRows.find((row) => row.feedType.id === feedTypeId) ?? null,
      };
    },
    enabled: Boolean(farmId && feedTypeId),
  });
}
