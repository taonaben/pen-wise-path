import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { penService } from "../services/penService";

export const penManagementKeys = {
  all: ["pen-management"] as const,
  byFarm: (farmId: string | undefined) => [...penManagementKeys.all, farmId ?? "no-farm"] as const,
};

export function usePenManagement(farmId: string | undefined) {
  return useQuery({
    queryKey: penManagementKeys.byFarm(farmId),
    queryFn: async () => {
      const [pens, assignments] = await Promise.all([
        penService.getPens(farmId!),
        penService.getCurrentAssignmentsByFarm(farmId!),
      ]);

      return { pens, assignments };
    },
    enabled: Boolean(farmId),
  });
}

type CreatePenPayload = {
  farmId: string;
  name: string;
  speciesId?: string | null;
  capacity?: number | null;
  status?: "active" | "inactive" | "maintenance";
  notes?: string | null;
};

type AssignAnimalPayload = {
  farmId: string;
  animalId: string;
  penId: string;
};

export function usePenActions(farmId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: penManagementKeys.byFarm(farmId) });
  };

  return {
    createPen: useMutation({
      mutationFn: (payload: CreatePenPayload) => penService.createPen(payload),
      onSuccess: invalidate,
    }),
    assignAnimal: useMutation({
      mutationFn: (payload: AssignAnimalPayload) => penService.assignAnimalToPen(payload),
      onSuccess: invalidate,
    }),
    clearAnimalAssignment: useMutation({
      mutationFn: ({ farmId: targetFarmId, animalId }: { farmId: string; animalId: string }) =>
        penService.clearCurrentAssignment(targetFarmId, animalId),
      onSuccess: invalidate,
    }),
  };
}
