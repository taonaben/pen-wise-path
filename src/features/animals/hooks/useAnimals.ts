import { useQuery } from "@tanstack/react-query";
import { animalService } from "../services/animalService";
import type { AnimalFilters } from "../types/animal.types";

export const animalKeys = {
  all: ["animals"] as const,
  list: (farmId: string | undefined, filters: AnimalFilters) =>
    [...animalKeys.all, farmId ?? "no-farm", filters] as const,
  detail: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalKeys.all, farmId ?? "no-farm", "detail", animalId ?? "no-animal"] as const,
};

export function useAnimals(farmId: string | undefined, filters: AnimalFilters) {
  return useQuery({
    queryKey: animalKeys.list(farmId, filters),
    queryFn: () => animalService.getAnimals({ farmId: farmId!, filters }),
    enabled: Boolean(farmId),
  });
}
