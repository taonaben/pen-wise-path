import { Activity, AlertTriangle, CircleDollarSign, Scale, TrendingUp, Wheat } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import { GrowthStatusBadge } from "../GrowthStatusBadge";
import { AnimalWeightTrendChart } from "./AnimalWeightTrendChart";
import { formatKg, formatKgPerDay, formatMoney, formatRatio } from "./animalDetailFormat";
import type { AnimalAlert } from "../../services/alertService";
import type { AnimalDetailMetrics, AnimalViewModel, WeightRecord } from "../../types/animal.types";

type Props = {
  animal: AnimalViewModel;
  metrics: AnimalDetailMetrics;
  weightRecords: WeightRecord[];
  alerts: AnimalAlert[];
};

export function AnimalOverviewTab({ animal, metrics, weightRecords, alerts }: Props) {
  const openAlerts = alerts.filter((alert) => !alert.resolved).slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Current Weight"
          value={formatKg(metrics.currentWeightKg)}
          icon={<Scale className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Total Gain"
          value={formatKg(metrics.totalGainKg)}
          icon={<TrendingUp className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Average Daily Gain"
          value={formatKgPerDay(metrics.averageDailyGainKg)}
          icon={<Activity className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Total Feed Cost"
          value={formatMoney(metrics.totalFeedCost)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Consumed"
          value={formatKg(metrics.totalFeedConsumedKg)}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="FCR"
          value={formatRatio(metrics.feedConversionRatio)}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Cost / Kg Gained"
          value={formatMoney(metrics.feedCostPerKgGained)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Estimated Margin"
          value={formatMoney(metrics.estimatedMargin)}
          icon={<AlertTriangle className="h-4 w-4" />}
          density="compact"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <AnimalWeightTrendChart records={weightRecords} title="Weight Over Time" />

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
