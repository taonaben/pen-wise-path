import type { PenFeedCostRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, formatRatio, statusClass } from "./format";

type Props = {
  rows: PenFeedCostRow[];
};

export function PenFeedCostTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-3 py-3 sm:px-4">
        <div className="text-sm font-medium text-foreground">Pen Feed Cost</div>
        <div className="text-xs text-farm-muted">Pen-level spend and conversion efficiency.</div>
      </div>
      <div className="space-y-3 p-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.penId ?? row.penName}
            className="rounded-xl border border-farm-600/35 bg-farm-900/45 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{row.penName}</div>
                <div className="text-xs text-farm-muted">
                  {row.speciesName || "-"} • {row.animals} animals
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.status)}`}
              >
                {row.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Feed used</div>
                <div className="font-medium text-foreground">{formatKg(row.feedUsedKg)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Feed cost</div>
                <div className="font-medium text-foreground">{formatMoney(row.feedCost)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Weight gain
                </div>
                <div className="font-medium text-foreground">{formatKg(row.totalWeightGainKg)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Avg FCR</div>
                <div className="font-medium text-foreground">{formatRatio(row.averageFcr)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Cost / kg gained
                </div>
                <div className="font-medium text-foreground">
                  {formatMoney(row.costPerKgGained, "/kg")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <table className="hidden w-full min-w-245 text-sm sm:table">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Pen</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Species</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Animals</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Used</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Cost</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Total Weight Gain</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Avg FCR</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Cost / Kg Gained</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.penId ?? row.penName} className="border-t border-farm-600/30">
              <td className="px-3 py-2 font-medium sm:px-4">{row.penName}</td>
              <td className="px-3 py-2 sm:px-4">{row.speciesName || "-"}</td>
              <td className="px-3 py-2 sm:px-4">{row.animals}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.feedUsedKg)}</td>
              <td className="px-3 py-2 sm:px-4">{formatMoney(row.feedCost)}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.totalWeightGainKg)}</td>
              <td className="px-3 py-2 sm:px-4">{formatRatio(row.averageFcr)}</td>
              <td className="px-3 py-2 sm:px-4">{formatMoney(row.costPerKgGained, "/kg")}</td>
              <td className="px-3 py-2 sm:px-4">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.status)}`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-3 text-sm text-farm-muted sm:p-4">No pen feed costs found.</div>
      )}
    </div>
  );
}
