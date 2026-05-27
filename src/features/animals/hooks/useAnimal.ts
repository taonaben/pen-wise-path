import { useQuery } from "@tanstack/react-query";
import { animalService } from "../services/animalService";
import { animalKeys } from "./useAnimals";

export function useAnimal(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalKeys.detail(farmId, animalId),
    queryFn: () => animalService.getAnimal(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
