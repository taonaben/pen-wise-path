import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalKeys } from "./useAnimals";
import { animalWeightKeys } from "./useAnimalWeights";
import { bulkWeightRowKeys } from "./useBulkWeightRows";
import { weightsForDateKeys } from "./useWeightsForDate";
import { weightService } from "../services/weightService";

type UpsertWeightPayload = {
  farmId: string;
  animalId: string;
  recordedAt: string;
  weightKg: number;
  notes?: string | null;
};

export function useUpsertAnimalWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertWeightPayload) => weightService.upsertAnimalWeight(payload),
    onSuccess: async (_, payload) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: weightsForDateKeys.all }),
        queryClient.invalidateQueries({ queryKey: bulkWeightRowKeys.all }),
        queryClient.invalidateQueries({
          queryKey: animalWeightKeys.list(payload.farmId, payload.animalId),
        }),
        queryClient.invalidateQueries({ queryKey: animalKeys.all }),
      ]);
    },
  });
}
