import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { farmService } from "../services/farmService";
import { CurrentFarmContext } from "../hooks/useCurrentFarm";

export function CurrentFarmProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ["current-farm"],
    queryFn: () => farmService.getCurrentFarm(),
    staleTime: 60_000,
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 text-farm-muted text-sm">
        Loading farm context...
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 px-6">
        <div className="max-w-md rounded-2xl border bg-farm-900 p-6 text-center">
          <Building2 className="mx-auto mb-4 h-8 w-8 text-farm-danger" />
          <h1 className="text-lg font-semibold">Farm context could not load</h1>
          <p className="mt-2 text-sm text-farm-muted">
            Check your Supabase connection and farm membership access.
          </p>
        </div>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 px-6">
        <div className="max-w-md rounded-2xl border bg-farm-900 p-6 text-center">
          <Building2 className="mx-auto mb-4 h-8 w-8 text-farm-lime" />
          <h1 className="text-lg font-semibold">No active farm membership</h1>
          <p className="mt-2 text-sm text-farm-muted">
            Your account is authenticated, but it is not connected to an active farm yet.
          </p>
        </div>
      </div>
    );
  }

  return <CurrentFarmContext.Provider value={query.data}>{children}</CurrentFarmContext.Provider>;
}
