import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedBatchService } from "../services/feedBatchService";
import { feedInventoryService } from "../services/feedInventoryService";
import { feedTypeService } from "../services/feedTypeService";
import type { FeedBatchCreatePayload, FeedTypeCreatePayload } from "../types/feed.types";

export const feedInventoryKeys = {
  all: ["feed-inventory"] as const,
  summary: (farmId: string | undefined) => [...feedInventoryKeys.all, farmId ?? "no-farm"] as const,
};

export function useFeedInventory(farmId: string | undefined) {
  return useQuery({
    queryKey: feedInventoryKeys.summary(farmId),
    queryFn: async () => {
      const [summary, rows] = await Promise.all([
        feedInventoryService.getFarmInventorySummary(farmId!),
        feedInventoryService.getFeedTypeInventorySummary(farmId!),
      ]);

      return {
        summary,
        rows,
      };
    },
    enabled: Boolean(farmId),
  });
}

export function useFeedInventoryActions(farmId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: feedInventoryKeys.summary(farmId) });
  };

  return {
    createFeedType: useMutation({
      mutationFn: (payload: FeedTypeCreatePayload) => feedTypeService.create(payload),
      onSuccess: invalidate,
    }),
    createFeedBatch: useMutation({
      mutationFn: (payload: FeedBatchCreatePayload) => feedBatchService.create(payload),
      onSuccess: invalidate,
    }),
  };
}
