import { useQuery } from "@tanstack/react-query";
import { weightService } from "../services/weightService";
import type { BulkWeightFilters } from "../types/animal.types";

export const bulkWeightRowKeys = {
  all: ["bulk-weight-rows"] as const,
  list: (farmId: string | undefined, recordedAt: string | undefined, filters: BulkWeightFilters) =>
    [...bulkWeightRowKeys.all, farmId ?? "no-farm", recordedAt ?? "no-date", filters] as const,
};

export function useBulkWeightRows(
  farmId: string | undefined,
  recordedAt: string | undefined,
  filters: BulkWeightFilters,
) {
  return useQuery({
    queryKey: bulkWeightRowKeys.list(farmId, recordedAt, filters),
    queryFn: () =>
      weightService.getBulkWeightRows({ farmId: farmId!, recordedAt: recordedAt!, filters }),
    enabled: Boolean(farmId && recordedAt),
  });
}
