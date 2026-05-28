import { StatCard } from "@/shared/components/ui/StatCard";
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Feed Consumed" value={formatKg(metrics.totalFeedConsumedKg)} />
        <StatCard title="Total Feed Cost" value={formatMoney(metrics.totalFeedCost)} />
        <StatCard title="FCR" value={formatRatio(metrics.feedConversionRatio)} />
        <StatCard title="Feed Cost / Kg Gained" value={formatMoney(metrics.feedCostPerKgGained)} />
        <StatCard title="Feed Records" value={String(allocations.length)} />
      </div>

      <AnimalFeedingTrendChart allocations={allocations} title="Feed Quantity and Cost Over Time" />

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-[920px] text-sm">
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
