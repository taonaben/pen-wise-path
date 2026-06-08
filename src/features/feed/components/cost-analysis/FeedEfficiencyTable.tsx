import type { FeedTypeEfficiencyRow } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, statusClass } from "./format";

type Props = {
  rows: FeedTypeEfficiencyRow[];
};

export function FeedEfficiencyTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-3 py-3 sm:px-4">
        <div className="text-sm font-medium text-foreground">Feed Efficiency</div>
        <div className="text-xs text-farm-muted">Weight gain is estimated per feed type.</div>
      </div>
      <div className="space-y-3 p-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={row.feedTypeId ?? row.feedTypeName}
            className="rounded-xl border border-farm-600/35 bg-farm-900/45 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{row.feedTypeName}</div>
                <div className="text-xs text-farm-muted">{row.animalsFed} animals fed</div>
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
                  Total used
                </div>
                <div className="font-medium text-foreground">{formatKg(row.totalUsedKg)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Total cost
                </div>
                <div className="font-medium text-foreground">{formatMoney(row.totalCost)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Avg cost / kg
                </div>
                <div className="font-medium text-foreground">
                  {formatMoney(row.averageCostPerKgFeed, "/kg")}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Estimated gained
                </div>
                <div className="font-medium text-foreground">{formatKg(row.estimatedKgGained)}</div>
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

      <table className="hidden w-full min-w-230 text-sm sm:table">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Type</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Total Used</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Total Cost</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Animals Fed</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Avg Cost / Kg Feed</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Estimated Kg Gained</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Cost / Kg Gained</th>
            <th className="px-3 py-2 text-left font-medium sm:px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feedTypeId ?? row.feedTypeName} className="border-t border-farm-600/30">
              <td className="px-3 py-2 font-medium sm:px-4">{row.feedTypeName}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.totalUsedKg)}</td>
              <td className="px-3 py-2 sm:px-4">{formatMoney(row.totalCost)}</td>
              <td className="px-3 py-2 sm:px-4">{row.animalsFed}</td>
              <td className="px-3 py-2 sm:px-4">{formatMoney(row.averageCostPerKgFeed, "/kg")}</td>
              <td className="px-3 py-2 sm:px-4">{formatKg(row.estimatedKgGained)}</td>
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
        <div className="p-3 text-sm text-farm-muted sm:p-4">No feed cost data found.</div>
      )}
    </div>
  );
}
