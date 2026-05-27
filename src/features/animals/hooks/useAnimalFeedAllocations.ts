import { useQuery } from "@tanstack/react-query";
import { feedingService } from "../services/feedingService";

export const animalFeedAllocationKeys = {
  all: ["animal-feed-allocations"] as const,
  list: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalFeedAllocationKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalFeedAllocations(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalFeedAllocationKeys.list(farmId, animalId),
    queryFn: () => feedingService.getAnimalFeedAllocations(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
