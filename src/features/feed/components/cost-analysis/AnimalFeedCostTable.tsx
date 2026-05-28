import type { AnimalFeedCostRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, formatRatio, statusClass } from "./format";

type Props = {
  rows: AnimalFeedCostRow[];
};

export function AnimalFeedCostTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-5 py-4">
        <div className="text-sm font-medium text-foreground">Animal Feed Cost</div>
        <div className="text-xs text-farm-muted">Animal-level cost, gain, FCR, and cost of gain.</div>
      </div>
      <table className="w-full min-w-275 text-sm">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Animal</th>
            <th className="px-5 py-3 text-left font-medium">Species</th>
            <th className="px-5 py-3 text-left font-medium">Pen</th>
            <th className="px-5 py-3 text-left font-medium">Feed Consumed</th>
            <th className="px-5 py-3 text-left font-medium">Feed Cost</th>
            <th className="px-5 py-3 text-left font-medium">Weight Gained</th>
            <th className="px-5 py-3 text-left font-medium">FCR</th>
            <th className="px-5 py-3 text-left font-medium">Cost / Kg Gained</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.animalId} className="border-t border-farm-600/30">
              <td className="px-5 py-3 font-medium">{row.tagNumber}</td>
              <td className="px-5 py-3">{row.speciesName}</td>
              <td className="px-5 py-3 text-farm-muted">{row.penName}</td>
              <td className="px-5 py-3">{formatKg(row.feedConsumedKg)}</td>
              <td className="px-5 py-3">{formatMoney(row.feedCost)}</td>
              <td className="px-5 py-3">{formatKg(row.weightGainedKg)}</td>
              <td className="px-5 py-3">{formatRatio(row.fcr)}</td>
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
      {rows.length === 0 && <div className="p-5 text-sm text-farm-muted">No animal feed costs found.</div>}
    </div>
  );
}
