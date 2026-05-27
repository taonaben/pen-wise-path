import { useQuery } from "@tanstack/react-query";
import { weightService } from "../services/weightService";

export const weightsForDateKeys = {
  all: ["weights-for-date"] as const,
  list: (farmId: string | undefined, recordedAt: string | undefined) =>
    [...weightsForDateKeys.all, farmId ?? "no-farm", recordedAt ?? "no-date"] as const,
};

export function useWeightsForDate(farmId: string | undefined, recordedAt: string | undefined) {
  return useQuery({
    queryKey: weightsForDateKeys.list(farmId, recordedAt),
    queryFn: () => weightService.getWeightsForDate(farmId!, recordedAt!),
    enabled: Boolean(farmId && recordedAt),
  });
}
