import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalHealthAssessmentKeys } from "./useAnimalHealthAssessment";
import { animalHealthEventKeys } from "./useAnimalHealthEvents";
import {
  healthAssessmentApi,
  type GenerateHealthAssessmentsPayload,
} from "../services/healthAssessmentApi";

type GenerateHealthAssessmentsArgs = {
  mode: GenerateHealthAssessmentsPayload["mode"];
  animalId?: string;
  options?: GenerateHealthAssessmentsPayload["options"];
};

export function useGenerateHealthAssessments(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: GenerateHealthAssessmentsArgs) => {
      if (!farmId) throw new Error("No active farm selected");

      return healthAssessmentApi.invokeGenerateHealthAssessments({
        farm_id: farmId,
        animal_id: args.animalId,
        mode: args.mode,
        options: args.options,
      });
    },
    onSuccess: async (_, args) => {
      if (args.animalId) {
        await queryClient.invalidateQueries({
          queryKey: animalHealthAssessmentKeys.latest(farmId, args.animalId),
        });
        await queryClient.invalidateQueries({
          queryKey: animalHealthEventKeys.list(farmId, args.animalId),
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: animalHealthAssessmentKeys.all });
      await queryClient.invalidateQueries({ queryKey: animalHealthEventKeys.all });
    },
  });
}
