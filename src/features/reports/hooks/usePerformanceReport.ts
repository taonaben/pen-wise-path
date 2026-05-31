import { useQuery } from "@tanstack/react-query";
import { performanceReportService } from "../services/performanceReportService";
import type { ReportFilters } from "../types/report.types";

export const performanceReportKeys = {
  all: ["performance-report"] as const,
  detail: (farmId: string | undefined, filters: ReportFilters) =>
    [...performanceReportKeys.all, farmId ?? "no-farm", filters] as const,
};

export function usePerformanceReport(farmId: string | undefined, filters: ReportFilters) {
  return useQuery({
    queryKey: performanceReportKeys.detail(farmId, filters),
    queryFn: () => performanceReportService.getReport(farmId!, filters),
    enabled: Boolean(farmId && filters.startDate && filters.endDate),
  });
}
