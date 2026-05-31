import { useQuery } from "@tanstack/react-query";
import { profitabilityReportService } from "../services/profitabilityReportService";
import type { ReportFilters } from "../types/report.types";

export const profitabilityReportKeys = {
  all: ["profitability-report"] as const,
  detail: (farmId: string | undefined, filters: ReportFilters) =>
    [...profitabilityReportKeys.all, farmId ?? "no-farm", filters] as const,
};

export function useProfitabilityReport(farmId: string | undefined, filters: ReportFilters) {
  return useQuery({
    queryKey: profitabilityReportKeys.detail(farmId, filters),
    queryFn: () => profitabilityReportService.getReport(farmId!, filters),
    enabled: Boolean(farmId && filters.startDate && filters.endDate),
  });
}
