import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/features/farm/services/auditService";

export const animalAuditLogKeys = {
  all: ["animal-audit-logs"] as const,
  list: (farmId: string | undefined, animalId: string | undefined) =>
    [...animalAuditLogKeys.all, farmId ?? "no-farm", animalId ?? "no-animal"] as const,
};

export function useAnimalAuditLogs(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: animalAuditLogKeys.list(farmId, animalId),
    queryFn: () =>
      auditService.getAuditLogsForEntity({
        farmId: farmId!,
        entityType: "animal",
        entityId: animalId!,
      }),
    enabled: Boolean(farmId && animalId),
  });
}
