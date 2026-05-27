import { useQuery } from "@tanstack/react-query";
import { auditService } from "../services/auditService";

export function useAuditLogs(farmId: string | undefined, canView: boolean) {
  return useQuery({
    queryKey: ["audit-logs", farmId],
    queryFn: () => auditService.getAuditLogs(farmId!),
    enabled: Boolean(farmId && canView),
  });
}
