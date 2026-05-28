import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketPriceService } from "../services/marketPriceService";
import { marketTrendService } from "../services/marketTrendService";
import type { MarketPriceFilters, MarketPricePayload } from "../types/market.types";

export const marketPriceKeys = {
  all: ["market-prices"] as const,
  list: (farmId: string | undefined, filters: MarketPriceFilters) =>
    [...marketPriceKeys.all, farmId ?? "no-farm", filters] as const,
};

export function useMarketPrices(farmId: string | undefined, filters: MarketPriceFilters) {
  return useQuery({
    queryKey: marketPriceKeys.list(farmId, filters),
    queryFn: () => marketPriceService.getMarketPrices(farmId!, filters),
    enabled: Boolean(farmId),
  });
}

export function useMarketPriceTrend(farmId: string | undefined, filters: MarketPriceFilters) {
  const pricesQuery = useMarketPrices(farmId, filters);
  const trend = useMemo(
    () => marketTrendService.getMarketPriceTrend(pricesQuery.data ?? []),
    [pricesQuery.data],
  );

  return {
    ...pricesQuery,
    trend,
  };
}

export function useMarketPriceActions(farmId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: marketPriceKeys.all });
  };

  return {
    createMarketPrice: useMutation({
      mutationFn: (payload: MarketPricePayload) => marketPriceService.createMarketPrice(payload),
      onSuccess: invalidate,
    }),
    updateMarketPrice: useMutation({
      mutationFn: (args: { priceId: string; payload: MarketPricePayload }) =>
        marketPriceService.updateMarketPrice(args.priceId, args.payload),
      onSuccess: invalidate,
    }),
    deleteMarketPrice: useMutation({
      mutationFn: (priceId: string) => marketPriceService.deleteMarketPrice(farmId!, priceId),
      onSuccess: invalidate,
    }),
  };
}
