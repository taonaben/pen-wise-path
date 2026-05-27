import { useQuery } from "@tanstack/react-query";
import { penService } from "../services/penService";

export const penKeys = {
  all: ["pens"] as const,
  list: (farmId: string | undefined) => [...penKeys.all, farmId ?? "no-farm"] as const,
};

export function usePens(farmId: string | undefined) {
  return useQuery({
    queryKey: penKeys.list(farmId),
    queryFn: () => penService.getPens(farmId!),
    enabled: Boolean(farmId),
  });
}
