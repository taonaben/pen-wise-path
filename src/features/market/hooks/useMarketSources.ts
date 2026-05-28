import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { marketSourceService } from "../services/marketSourceService";
import type { MarketSourcePayload } from "../types/market.types";

export const marketSourceKeys = {
  all: ["market-sources"] as const,
  list: (farmId: string | undefined) => [...marketSourceKeys.all, farmId ?? "no-farm"] as const,
};

export function useMarketSources(farmId: string | undefined) {
  return useQuery({
    queryKey: marketSourceKeys.list(farmId),
    queryFn: () => marketSourceService.getMarketSources(farmId!),
    enabled: Boolean(farmId),
  });
}

export function useMarketSourceActions(farmId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: marketSourceKeys.list(farmId) });
  };

  return {
    createMarketSource: useMutation({
      mutationFn: (payload: MarketSourcePayload) => marketSourceService.createMarketSource(payload),
      onSuccess: invalidate,
    }),
    updateMarketSource: useMutation({
      mutationFn: (args: { sourceId: string; payload: MarketSourcePayload }) =>
        marketSourceService.updateMarketSource(args.sourceId, args.payload),
      onSuccess: invalidate,
    }),
    deactivateMarketSource: useMutation({
      mutationFn: (sourceId: string) => marketSourceService.deactivateMarketSource(farmId!, sourceId),
      onSuccess: invalidate,
    }),
  };
}
