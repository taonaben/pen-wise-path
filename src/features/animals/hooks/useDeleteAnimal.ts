import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalService } from "../services/animalService";
import { animalAuditLogKeys } from "./useAnimalAuditLogs";
import { animalKeys } from "./useAnimals";

export function useDeleteAnimal(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (animalId: string) => {
      if (!farmId) throw new Error("No farm selected");
      return animalService.deleteAnimal({ farmId, animalId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: animalKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["audit-logs", farmId] });
      await queryClient.invalidateQueries({ queryKey: animalAuditLogKeys.all });
    },
  });
}
