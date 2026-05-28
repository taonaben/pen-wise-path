import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  feedingService,
  type CreateFeedingEventPayload,
  type FeedingEventsFilters,
} from "@/features/animals/services/feedingService";

export const feedingEventKeys = {
  all: ["feeding-events"] as const,
  list: (farmId: string | undefined, filters: FeedingEventsFilters) =>
    [...feedingEventKeys.all, farmId ?? "no-farm", filters] as const,
  detail: (farmId: string | undefined, eventId: string | undefined) =>
    [...feedingEventKeys.all, "detail", farmId ?? "no-farm", eventId ?? "no-event"] as const,
};

export function useFeedingEvents(farmId: string | undefined, filters: FeedingEventsFilters) {
  return useQuery({
    queryKey: feedingEventKeys.list(farmId, filters),
    queryFn: () => feedingService.getFeedingEvents(farmId!, filters),
    enabled: Boolean(farmId),
  });
}

export function useFeedingEventDetail(farmId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: feedingEventKeys.detail(farmId, eventId),
    queryFn: () => feedingService.getFeedingEventById(farmId!, eventId!),
    enabled: Boolean(farmId && eventId),
  });
}

export function useFeedingEventActions(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return {
    recordFeedingEvent: useMutation({
      mutationFn: (payload: CreateFeedingEventPayload) =>
        feedingService.createFeedingEvent(payload),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: feedingEventKeys.all });
        await queryClient.invalidateQueries({ queryKey: ["animal-feed-allocations"] });
      },
    }),
  };
}
