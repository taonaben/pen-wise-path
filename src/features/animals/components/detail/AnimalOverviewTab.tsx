import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";
import { StatCard } from "@/shared/components/ui/StatCard";
import { GrowthStatusBadge } from "../GrowthStatusBadge";
import { formatKg, formatKgPerDay, formatMoney, formatRatio } from "./animalDetailFormat";
import type { AnimalAlert } from "../../services/alertService";
import type { AnimalDetailMetrics, AnimalViewModel } from "../../types/animal.types";

type Props = {
  animal: AnimalViewModel;
  metrics: AnimalDetailMetrics;
  alerts: AnimalAlert[];
};

export function AnimalOverviewTab({ animal, metrics, alerts }: Props) {
  const openAlerts = alerts.filter((alert) => !alert.resolved).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Current Weight" value={formatKg(metrics.currentWeightKg)} />
        <StatCard title="Total Gain" value={formatKg(metrics.totalGainKg)} />
        <StatCard title="Average Daily Gain" value={formatKgPerDay(metrics.averageDailyGainKg)} />
        <StatCard title="Total Feed Cost" value={formatMoney(metrics.totalFeedCost)} />
        <StatCard title="Feed Consumed" value={formatKg(metrics.totalFeedConsumedKg)} />
        <StatCard title="FCR" value={formatRatio(metrics.feedConversionRatio)} />
        <StatCard title="Feed Cost / Kg Gained" value={formatMoney(metrics.feedCostPerKgGained)} />
        <StatCard title="Estimated Margin" value={formatMoney(metrics.estimatedMargin)} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <PlaceholderLineChart title="Weight Over Time" />

        <div className="space-y-4">
          <div className="rounded-xl border bg-farm-800/80 p-5">
            <h2 className="text-base font-semibold">Selling Recommendation</h2>
            <p className="mt-2 text-sm text-farm-muted">{animal.recommendation}</p>
            <div className="mt-3">
              <GrowthStatusBadge performance={animal.performance} />
            </div>
          </div>

          <div className="rounded-xl border bg-farm-800/80 p-5">
            <h2 className="text-base font-semibold">Latest Alerts</h2>
            <div className="mt-3 space-y-3">
              {openAlerts.length === 0 ? (
                <p className="text-sm text-farm-muted">No open alerts.</p>
              ) : (
                openAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="border-t border-farm-600/30 pt-3 first:border-0 first:pt-0"
                  >
                    <div className="text-sm font-medium">{alert.title}</div>
                    <p className="mt-1 text-xs text-farm-muted">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-farm-800/80 p-5">
        <h2 className="text-base font-semibold">Notes</h2>
        <p className="mt-2 text-sm text-farm-muted">{animal.notes || "No notes recorded."}</p>
      </div>
    </div>
  );
}
