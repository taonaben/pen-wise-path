import { useQuery } from "@tanstack/react-query";
import { sellingPredictionApi } from "../services/sellingPredictionApi";

export const sellingPredictionKeys = {
  all: ["selling-predictions"] as const,
  list: (farmId: string | undefined) => [...sellingPredictionKeys.all, farmId ?? "no-farm"] as const,
  animal: (farmId: string | undefined, animalId: string | undefined) =>
    [...sellingPredictionKeys.all, farmId ?? "no-farm", "animal", animalId ?? "no-animal"] as const,
};

export function useSellingPredictions(farmId: string | undefined) {
  return useQuery({
    queryKey: sellingPredictionKeys.list(farmId),
    queryFn: () => sellingPredictionApi.getSellingPredictions(farmId!),
    enabled: Boolean(farmId),
  });
}

export function useSellingPredictionDetail(
  farmId: string | undefined,
  animalId: string | undefined,
) {
  return useQuery({
    queryKey: sellingPredictionKeys.animal(farmId, animalId),
    queryFn: () => sellingPredictionApi.getSellingPredictionByAnimal(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
