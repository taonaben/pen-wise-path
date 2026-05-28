import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useGenerateGrowthAlerts } from "../hooks/useGenerateGrowthAlerts";
import { useGrowthAlerts } from "../hooks/useGrowthAlerts";

function formatAlertValue(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toFixed(3);
}

export function GrowthAlertsPage() {
  const { currentFarm } = useCurrentFarm();
  const alertsQuery = useGrowthAlerts(currentFarm.id);
  const runScan = useGenerateGrowthAlerts(currentFarm.id);
  const alerts = alertsQuery.data ?? [];

  const onRunScan = async () => {
    try {
      const result = await runScan.mutateAsync({ mode: "farm_scan" });
      toast.success(
        `Growth scan complete: ${result.generated_alerts} generated, ${result.updated_alerts} updated across ${result.scanned_animals} animals.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Growth scan failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Growth Alerts"
        description="Animals showing abnormal growth or species-specific performance concerns."
        action={
          <button
            type="button"
            onClick={onRunScan}
            disabled={runScan.isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {runScan.isPending ? "Running scan..." : "Run Growth Scan"}
          </button>
        }
      />

      {runScan.data && (
        <div className="rounded-2xl border bg-farm-800/80 p-4 text-sm text-farm-muted">
          Last scan summary: {runScan.data.generated_alerts} generated,{" "}
          {runScan.data.updated_alerts} updated, {runScan.data.skipped_alerts} skipped.
        </div>
      )}

      {alertsQuery.isLoading && (
        <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          Loading growth alerts...
        </div>
      )}

      {alertsQuery.isError && (
        <div className="rounded-2xl border border-farm-danger/30 bg-farm-danger/10 p-6 text-sm text-farm-danger">
          Growth alerts could not be loaded.
        </div>
      )}

      {!alertsQuery.isLoading && !alertsQuery.isError && alerts.length === 0 && (
        <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          No active growth alerts found.
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl border bg-farm-800/80 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-farm-600/40 px-2 py-0.5 text-xs uppercase tracking-wide text-farm-muted">
                    {alert.severity}
                  </span>
                  <span className="rounded-full border border-farm-600/40 px-2 py-0.5 text-xs uppercase tracking-wide text-farm-muted">
                    {alert.alert_type.replaceAll("_", " ")}
                  </span>
                  <span className="text-xs text-farm-muted">Status: {alert.status}</span>
                </div>
                <div className="mt-2 text-sm font-medium">{alert.title}</div>
                <p className="mt-1 text-sm text-farm-muted">{alert.message}</p>
                <div className="mt-2 text-xs text-farm-muted">
                  Actual: {formatAlertValue(alert.actual_value)} | Expected:{" "}
                  {formatAlertValue(alert.expected_value)} | Confidence:{" "}
                  {formatAlertValue(alert.confidence)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alert.animal_id ? (
                  <Link
                    to="/animals/$id"
                    params={{ id: alert.animal_id }}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-farm-600/50 px-3 text-xs text-farm-muted hover:text-foreground"
                  >
                    View Animal
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
