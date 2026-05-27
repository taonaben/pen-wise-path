import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalService } from "../services/animalService";
import { animalKeys } from "./useAnimals";
import type { AnimalUpdatePayload } from "../types/animal.types";

export function useUpdateAnimal(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AnimalUpdatePayload) => animalService.updateAnimal(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: animalKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["audit-logs", farmId] });
    },
  });
}
