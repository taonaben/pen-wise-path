import { useQuery } from "@tanstack/react-query";
import { breedService } from "../services/breedService";

export const animalBreedKeys = {
  all: ["animal-breeds"] as const,
  list: (speciesId?: string) => [...animalBreedKeys.all, speciesId ?? "all"] as const,
};

export function useAnimalBreeds(speciesId?: string) {
  return useQuery({
    queryKey: animalBreedKeys.list(speciesId),
    queryFn: () => breedService.getBreeds(speciesId),
    staleTime: 5 * 60_000,
  });
}
