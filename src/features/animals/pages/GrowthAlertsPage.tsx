import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { GrowthStatusBadge } from "../components/GrowthStatusBadge";
import { useAnimals } from "../hooks/useAnimals";

export function GrowthAlertsPage() {
  const { currentFarm } = useCurrentFarm();
  const animalsQuery = useAnimals(currentFarm.id, {
    performance: "all",
    status: "active",
    sex: "all",
  });
  const alerts = (animalsQuery.data?.animals ?? []).filter((animal) =>
    ["Critical", "Underperforming"].includes(animal.performance),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Growth Alerts"
        description="Animals showing abnormal growth or species-specific performance concerns."
      />

      {animalsQuery.isLoading && (
        <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          Loading growth alerts...
        </div>
      )}

      {!animalsQuery.isLoading && alerts.length === 0 && (
        <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          No active growth alerts found.
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((animal) => (
          <div
            key={animal.id}
            className="flex items-center justify-between rounded-2xl border bg-farm-800/80 p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-farm-lime">{animal.tagNumber}</span>
                <GrowthStatusBadge performance={animal.performance} />
              </div>
              <div className="mt-1 text-sm">
                {animal.tagNumber} is underperforming for {animal.speciesLabel.toLowerCase()} growth
                expectations.
              </div>
            </div>
            <div className="text-xs text-farm-muted">{animal.recommendation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
