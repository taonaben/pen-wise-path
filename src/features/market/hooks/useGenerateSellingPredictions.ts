import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellingPredictionApi } from "../services/sellingPredictionApi";
import { sellingPredictionKeys } from "./useSellingPredictions";
import type {
  GenerateSellingPredictionsPayload,
  MarkSoldPayload,
} from "../types/sellingPrediction.types";

export function useGenerateSellingPredictions(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: Partial<GenerateSellingPredictionsPayload>) =>
      sellingPredictionApi.invokePredictionRun({
        farm_id: farmId!,
        mode: "farm_scan",
        ...payload,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellingPredictionKeys.list(farmId) });
    },
  });
}

export function useMarkAnimalSoldFromPrediction(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkSoldPayload) =>
      sellingPredictionApi.markAnimalAsSoldFromPrediction(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sellingPredictionKeys.list(farmId) });
      await queryClient.invalidateQueries({ queryKey: ["animals"] });
    },
  });
}
