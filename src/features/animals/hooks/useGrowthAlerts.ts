import { useQuery } from "@tanstack/react-query";
import { growthAlertApi } from "../services/growthAlertApi";

export const growthAlertKeys = {
  all: ["growth-alerts"] as const,
  list: (farmId: string | undefined) => [...growthAlertKeys.all, farmId ?? "no-farm"] as const,
};

export function useGrowthAlerts(farmId: string | undefined) {
  return useQuery({
    queryKey: growthAlertKeys.list(farmId),
    queryFn: () => growthAlertApi.getGrowthAlerts(farmId!),
    enabled: Boolean(farmId),
  });
}