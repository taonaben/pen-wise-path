import { StatCard } from "@/shared/components/ui/StatCard";
import { CalendarDays, CircleDollarSign, Scale, Wheat } from "lucide-react";
import { AnimalFeedingTrendChart } from "./AnimalFeedingTrendChart";
import { formatKg, formatMoney, formatRatio } from "./animalDetailFormat";
import type { AnimalDetailMetrics, AnimalFeedAllocationViewModel } from "../../types/animal.types";

type Props = {
  allocations: AnimalFeedAllocationViewModel[];
  metrics: AnimalDetailMetrics;
  isLoading: boolean;
};

export function AnimalFeedingTab({ allocations, metrics, isLoading }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard
          title="Total Feed Consumed"
          value={formatKg(metrics.totalFeedConsumedKg)}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Total Feed Cost"
          value={formatMoney(metrics.totalFeedCost)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="FCR"
          value={formatRatio(metrics.feedConversionRatio)}
          icon={<Scale className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Cost / Kg Gained"
          value={formatMoney(metrics.feedCostPerKgGained)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Records"
          value={String(allocations.length)}
          icon={<CalendarDays className="h-4 w-4" />}
          density="compact"
        />
      </div>

      <AnimalFeedingTrendChart allocations={allocations} title="Feed Quantity and Cost Over Time" />

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <div className="space-y-2 p-3 md:hidden">
          {allocations.map((allocation) => (
            <div
              key={allocation.id}
              className="rounded-lg border border-farm-600/30 bg-farm-900/45 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {allocation.feedTypeName}
                  </div>
                  <div className="text-xs text-farm-muted">{allocation.date}</div>
                </div>
                <Wheat className="h-4 w-4 text-farm-lime" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-farm-muted">Quantity</div>
                  <div className="font-medium text-foreground">
                    {formatKg(allocation.allocatedQuantityKg)}
                  </div>
                </div>
                <div>
                  <div className="text-farm-muted">Cost</div>
                  <div className="font-medium text-foreground">
                    {formatMoney(allocation.allocatedCost)}
                  </div>
                </div>
                <div>
                  <div className="text-farm-muted">Method</div>
                  <div className="font-medium text-foreground capitalize">
                    {allocation.allocationMethod}
                  </div>
                </div>
                <div>
                  <div className="text-farm-muted">Source</div>
                  <div className="font-medium text-foreground">{allocation.source}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <table className="hidden w-full min-w-230 text-sm md:table">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              {["Date", "Feed Type", "Source", "Quantity", "Cost", "Method", "Recorded By"].map(
                (heading) => (
                  <th key={heading} className="px-5 py-3 text-left font-medium">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {allocations.map((allocation) => (
              <tr key={allocation.id} className="border-t border-farm-600/30">
                <td className="px-5 py-3">{allocation.date}</td>
                <td className="px-5 py-3">{allocation.feedTypeName}</td>
                <td className="px-5 py-3 text-farm-muted">{allocation.source}</td>
                <td className="px-5 py-3">{formatKg(allocation.allocatedQuantityKg)}</td>
                <td className="px-5 py-3">{formatMoney(allocation.allocatedCost)}</td>
                <td className="px-5 py-3 text-farm-muted">{allocation.allocationMethod}</td>
                <td className="px-5 py-3 text-farm-muted">
                  {allocation.recordedBy?.slice(0, 8) ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="p-5 text-sm text-farm-muted">Loading feed records...</div>}
        {!isLoading && allocations.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">
            No feeding allocations found for this animal.
          </div>
        )}
      </div>
    </div>
  );
}
