import { useQuery } from "@tanstack/react-query";
import { healthService } from "../services/healthService";

export const animalHealthEventKeys = {
  all: ["animal-health-events"] as const,
  list: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalHealthEventKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalHealthEvents(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalHealthEventKeys.list(farmId, animalId),
    queryFn: () => healthService.getAnimalHealthEvents(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
