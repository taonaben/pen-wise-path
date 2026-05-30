import { useQuery } from "@tanstack/react-query";
import { healthService } from "../services/healthService";

export const animalHealthAssessmentKeys = {
  all: ["animal-health-assessments"] as const,
  latest: (farmId: string | undefined, animalId: string | undefined) =>
    [
      ...animalHealthAssessmentKeys.all,
      "latest",
      farmId ?? "no-farm",
      animalId ?? "no-animal",
    ] as const,
};

export function useAnimalHealthAssessment(
  farmId: string | undefined,
  animalId: string | undefined,
) {
  return useQuery({
    queryKey: animalHealthAssessmentKeys.latest(farmId, animalId),
    queryFn: () => healthService.getLatestAnimalHealthAssessment(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}
