import type { AnimalFeedCostRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, formatRatio, statusClass } from "./format";

type Props = {
  rows: AnimalFeedCostRow[];
};

export function AnimalFeedCostTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-3 py-3 sm:px-4">
        <div className="text-sm font-medium text-foreground">Animal Feed Cost</div>
        <div className="text-xs text-farm-muted">
          Animal-level cost, gain, FCR, and cost of gain.
        </div>
      </div>
      <div className="space-y-3 p-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.animalId}
            className="rounded-xl border border-farm-600/35 bg-farm-900/45 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{row.tagNumber}</div>
                <div className="text-xs text-farm-muted">
                  {row.speciesName} • {row.penName}
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
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Feed consumed
                </div>
                <div className="font-medium text-foreground">{formatKg(row.feedConsumedKg)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Feed cost</div>
                <div className="font-medium text-foreground">{formatMoney(row.feedCost)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Weight gained
                </div>
                <div className="font-medium text-foreground">{formatKg(row.weightGainedKg)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">FCR</div>
                <div className="font-medium text-foreground">{formatRatio(row.fcr)}</div>
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

      <table className="hidden w-full min-w-275 text-sm sm:table">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Animal</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Species</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Pen</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Consumed</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Cost</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Weight Gained</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">FCR</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Cost / Kg Gained</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.animalId} className="border-t border-farm-600/30">
              <td className="px-3 py-2 font-medium sm:px-4">{row.tagNumber}</td>
              <td className="px-3 py-2 sm:px-4">{row.speciesName}</td>
              <td className="px-3 py-2 text-farm-muted sm:px-4">{row.penName}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.feedConsumedKg)}</td>
              <td className="px-3 py-2 sm:px-4">{formatMoney(row.feedCost)}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.weightGainedKg)}</td>
              <td className="px-3 py-2 sm:px-4">{formatRatio(row.fcr)}</td>
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
        <div className="p-3 text-sm text-farm-muted sm:p-4">No animal feed costs found.</div>
      )}
    </div>
  );
}
