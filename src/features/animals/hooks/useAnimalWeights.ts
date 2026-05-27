import { useQuery } from "@tanstack/react-query";
import { weightService } from "../services/weightService";

export const animalWeightKeys = {
  all: ["animal-weights"] as const,
  list: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalWeightKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalWeights(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalWeightKeys.list(farmId, animalId),
    queryFn: () => weightService.getAnimalWeights(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
