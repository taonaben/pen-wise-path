import type { FeedTypeEfficiencyRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, statusClass } from "./format";

type Props = {
  rows: FeedTypeEfficiencyRow[];
};

export function FeedEfficiencyTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-5 py-4">
        <div className="text-sm font-medium text-foreground">Feed Efficiency</div>
        <div className="text-xs text-farm-muted">Weight gain is estimated per feed type.</div>
      </div>
      <table className="w-full min-w-230 text-sm">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Feed Type</th>
            <th className="px-5 py-3 text-left font-medium">Total Used</th>
            <th className="px-5 py-3 text-left font-medium">Total Cost</th>
            <th className="px-5 py-3 text-left font-medium">Animals Fed</th>
            <th className="px-5 py-3 text-left font-medium">Avg Cost / Kg Feed</th>
            <th className="px-5 py-3 text-left font-medium">Estimated Kg Gained</th>
            <th className="px-5 py-3 text-left font-medium">Cost / Kg Gained</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feedTypeId ?? row.feedTypeName} className="border-t border-farm-600/30">
              <td className="px-5 py-3 font-medium">{row.feedTypeName}</td>
              <td className="px-5 py-3">{formatKg(row.totalUsedKg)}</td>
              <td className="px-5 py-3">{formatMoney(row.totalCost)}</td>
              <td className="px-5 py-3">{row.animalsFed}</td>
              <td className="px-5 py-3">{formatMoney(row.averageCostPerKgFeed, "/kg")}</td>
              <td className="px-5 py-3">{formatKg(row.estimatedKgGained)}</td>
              <td className="px-5 py-3">{formatMoney(row.costPerKgGained, "/kg")}</td>
              <td className="px-5 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-5 text-sm text-farm-muted">No feed cost data found.</div>}
    </div>
  );
}
