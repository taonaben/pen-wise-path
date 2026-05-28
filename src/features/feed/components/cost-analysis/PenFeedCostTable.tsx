import type { PenFeedCostRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, formatRatio, statusClass } from "./format";

type Props = {
  rows: PenFeedCostRow[];
};

export function PenFeedCostTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-5 py-4">
        <div className="text-sm font-medium text-foreground">Pen Feed Cost</div>
        <div className="text-xs text-farm-muted">Pen-level spend and conversion efficiency.</div>
      </div>
      <table className="w-full min-w-245 text-sm">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Pen</th>
            <th className="px-5 py-3 text-left font-medium">Species</th>
            <th className="px-5 py-3 text-left font-medium">Animals</th>
            <th className="px-5 py-3 text-left font-medium">Feed Used</th>
            <th className="px-5 py-3 text-left font-medium">Feed Cost</th>
            <th className="px-5 py-3 text-left font-medium">Total Weight Gain</th>
            <th className="px-5 py-3 text-left font-medium">Avg FCR</th>
            <th className="px-5 py-3 text-left font-medium">Cost / Kg Gained</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.penId ?? row.penName} className="border-t border-farm-600/30">
              <td className="px-5 py-3 font-medium">{row.penName}</td>
              <td className="px-5 py-3">{row.speciesName || "-"}</td>
              <td className="px-5 py-3">{row.animals}</td>
              <td className="px-5 py-3">{formatKg(row.feedUsedKg)}</td>
              <td className="px-5 py-3">{formatMoney(row.feedCost)}</td>
              <td className="px-5 py-3">{formatKg(row.totalWeightGainKg)}</td>
              <td className="px-5 py-3">{formatRatio(row.averageFcr)}</td>
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
      {rows.length === 0 && <div className="p-5 text-sm text-farm-muted">No pen feed costs found.</div>}
    </div>
  );
}
