import { Link } from "@tanstack/react-router";
import { StatCard } from "@/shared/components/ui/StatCard";
import { AnimalWeightTrendChart } from "./AnimalWeightTrendChart";
import { formatKg, formatKgPerDay } from "./animalDetailFormat";
import type { AnimalDetailMetrics, WeightRecord } from "../../types/animal.types";

type Props = {
  records: WeightRecord[];
  metrics: AnimalDetailMetrics;
  isLoading: boolean;
};

export function AnimalWeightTab({ records, metrics, isLoading }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          to="/animals/weights"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950"
        >
          Record Weights
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Starting Weight" value={formatKg(metrics.startingWeightKg)} />
        <StatCard title="Current Weight" value={formatKg(metrics.currentWeightKg)} />
        <StatCard title="Average Daily Gain" value={formatKgPerDay(metrics.averageDailyGainKg)} />
      </div>

      <AnimalWeightTrendChart records={records} title="Weight Trend" />

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              {["Date", "Weight", "Notes", "Recorded"].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-t border-farm-600/30">
                <td className="px-5 py-3">{record.recorded_at}</td>
                <td className="px-5 py-3">{formatKg(Number(record.weight_kg))}</td>
                <td className="px-5 py-3 text-farm-muted">{record.notes ?? "-"}</td>
                <td className="px-5 py-3 text-farm-muted">{record.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <div className="p-5 text-sm text-farm-muted">Loading weight records...</div>}
        {!isLoading && records.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">No weight records found.</div>
        )}
      </div>
    </div>
  );
}
