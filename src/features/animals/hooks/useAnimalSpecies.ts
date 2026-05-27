import { useQuery } from "@tanstack/react-query";
import { speciesService } from "../services/speciesService";

export const animalSpeciesKeys = {
  all: ["animal-species"] as const,
};

export function useAnimalSpecies() {
  return useQuery({
    queryKey: animalSpeciesKeys.all,
    queryFn: () => speciesService.getSpecies(),
    staleTime: 5 * 60_000,
  });
}
