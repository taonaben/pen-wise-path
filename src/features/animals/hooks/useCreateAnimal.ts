import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalService } from "../services/animalService";
import { animalKeys } from "./useAnimals";
import type { AnimalCreatePayload } from "../types/animal.types";

export function useCreateAnimal(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AnimalCreatePayload) => animalService.createAnimal(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: animalKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["audit-logs", farmId] });
    },
  });
}
