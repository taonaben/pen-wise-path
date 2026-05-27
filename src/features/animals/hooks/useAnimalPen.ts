import { useQuery } from "@tanstack/react-query";
import { penService } from "../services/penService";

export const animalPenKeys = {
  all: ["animal-pen"] as const,
  current: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalPenKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalPen(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalPenKeys.current(farmId, animalId),
    queryFn: () => penService.getCurrentAnimalPen(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
