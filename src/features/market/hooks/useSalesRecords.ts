import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { animalKeys } from "@/features/animals/hooks/useAnimals";
import { salesAnalyticsService } from "../services/salesAnalyticsService";
import { salesRecordService } from "../services/salesRecordService";
import type { SalesFilters, SalesRecordPayload } from "../types/sales.types";

export const salesRecordKeys = {
  all: ["sales-records"] as const,
  list: (farmId: string | undefined, filters: SalesFilters) =>
    [...salesRecordKeys.all, farmId ?? "no-farm", filters] as const,
  detail: (farmId: string | undefined, saleId: string | undefined) =>
    [...salesRecordKeys.all, farmId ?? "no-farm", "detail", saleId ?? "no-sale"] as const,
  draft: (farmId: string | undefined, animalId: string | undefined) =>
    [...salesRecordKeys.all, farmId ?? "no-farm", "draft", animalId ?? "no-animal"] as const,
};

export function useSalesRecords(farmId: string | undefined, filters: SalesFilters) {
  return useQuery({
    queryKey: salesRecordKeys.list(farmId, filters),
    queryFn: () => salesRecordService.getSalesRecords(farmId!, filters),
    enabled: Boolean(farmId),
  });
}

export function useSaleDetail(farmId: string | undefined, saleId: string | undefined) {
  return useQuery({
    queryKey: salesRecordKeys.detail(farmId, saleId),
    queryFn: () => salesRecordService.getSaleById(farmId!, saleId!),
    enabled: Boolean(farmId && saleId),
  });
}

export function useSaleDraftContext(farmId: string | undefined, animalId: string | undefined) {
  return useQuery({
    queryKey: salesRecordKeys.draft(farmId, animalId),
    queryFn: () => salesRecordService.getSaleDraftContext(farmId!, animalId!),
    enabled: Boolean(farmId && animalId),
  });
}

export function useSalesAnalytics(farmId: string | undefined, filters: SalesFilters) {
  const query = useSalesRecords(farmId, filters);
  const analytics = useMemo(
    () => salesAnalyticsService.getSalesAnalytics(query.data ?? []),
    [query.data],
  );

  return { ...query, analytics };
}

export function useSalesRecordActions(farmId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: salesRecordKeys.all });
    await queryClient.invalidateQueries({ queryKey: animalKeys.all });
    await queryClient.invalidateQueries({ queryKey: ["market-prices"] });
    await queryClient.invalidateQueries({ queryKey: ["selling-predictions"] });
  };

  return {
    createSale: useMutation({
      mutationFn: (payload: SalesRecordPayload) => salesRecordService.createSaleRecord(payload),
      onSuccess: invalidate,
    }),
    updateSale: useMutation({
      mutationFn: (args: { saleId: string; payload: SalesRecordPayload }) =>
        salesRecordService.updateSaleRecord(args.saleId, args.payload),
      onSuccess: invalidate,
    }),
    voidSale: useMutation({
      mutationFn: (args: { saleId: string; reason?: string | null }) =>
        salesRecordService.voidSaleRecord(farmId!, args.saleId, args.reason),
      onSuccess: invalidate,
    }),
  };
}
