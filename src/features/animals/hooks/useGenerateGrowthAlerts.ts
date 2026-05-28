import { useMutation, useQueryClient } from "@tanstack/react-query";
import { animalAlertKeys } from "./useAnimalAlerts";
import { growthAlertKeys } from "./useGrowthAlerts";
import { growthAlertApi, type GenerateGrowthAlertsPayload } from "../services/growthAlertApi";

type GenerateGrowthAlertsArgs = {
  mode: GenerateGrowthAlertsPayload["mode"];
  animalId?: string;
  options?: GenerateGrowthAlertsPayload["options"];
};

export function useGenerateGrowthAlerts(farmId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: GenerateGrowthAlertsArgs) => {
      if (!farmId) throw new Error("No active farm selected");

      return growthAlertApi.invokeGenerateGrowthAlerts({
        farm_id: farmId,
        animal_id: args.animalId,
        mode: args.mode,
        options: args.options,
      });
    },
    onSuccess: async (_, args) => {
      await queryClient.invalidateQueries({ queryKey: growthAlertKeys.list(farmId) });

      if (args.animalId) {
        await queryClient.invalidateQueries({
          queryKey: animalAlertKeys.list(farmId, args.animalId),
        });
      } else {
        await queryClient.invalidateQueries({ queryKey: animalAlertKeys.all });
      }
    },
  });
}
