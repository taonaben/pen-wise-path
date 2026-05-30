import { useMutation, useQueryClient } from "@tanstack/react-query";
import { healthService } from "../services/healthService";
import { animalHealthEventKeys } from "./useAnimalHealthEvents";
import { animalHealthAssessmentKeys } from "./useAnimalHealthAssessment";
import type { CreateHealthEventPayload } from "../types/animal.types";

export function useCreateHealthEvent(farmId: string | undefined, animalId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateHealthEventPayload, "farmId" | "animalId">) => {
      if (!farmId || !animalId) throw new Error("Missing farm or animal context");

      return healthService.createHealthEvent({
        ...payload,
        farmId,
        animalId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: animalHealthEventKeys.list(farmId, animalId),
      });
      await queryClient.invalidateQueries({
        queryKey: animalHealthAssessmentKeys.latest(farmId, animalId),
      });
      await queryClient.invalidateQueries({ queryKey: ["audit-logs", farmId] });
    },
  });
}
