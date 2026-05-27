import { useQuery } from "@tanstack/react-query";
import { alertService } from "../services/alertService";

export const animalAlertKeys = {
  all: ["animal-alerts"] as const,
  list: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalAlertKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalAlerts(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalAlertKeys.list(farmId, animalId),
    queryFn: () => alertService.getAnimalAlerts(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
