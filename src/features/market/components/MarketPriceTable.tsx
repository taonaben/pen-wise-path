import { Button } from "@/components/ui/button";
import type { MarketPriceViewModel } from "../types/market.types";
import { formatBasis, formatMoney, formatWeightRange } from "./marketUiFormat";

type Props = {
  rows: MarketPriceViewModel[];
  onEdit: (row: MarketPriceViewModel) => void;
  onDelete: (row: MarketPriceViewModel) => void;
};

export function MarketPriceTable({ rows, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto md:rounded-xl md:border md:bg-farm-800/80">
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-farm-600/45 bg-farm-800/90 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{row.speciesName}</div>
                <div className="text-xs text-farm-muted">
                  {new Date(row.recordedAt).toLocaleDateString()} • {row.sourceName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {formatMoney(row.pricePerKg, row.currency, "/kg")}
                </div>
                <div className="text-[11px] capitalize text-farm-muted">
                  {formatBasis(row.priceBasis)}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Weight range
                </div>
                <div className="font-medium text-foreground">
                  {formatWeightRange(row.weightMinKg, row.weightMaxKg)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Grade</div>
                <div className="font-medium text-foreground">{row.qualityGrade ?? "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">Notes</div>
                <div className="font-medium text-foreground">{row.notes ?? "-"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                  Recorded by
                </div>
                <div className="font-medium text-foreground">{row.recordedBy ?? "-"}</div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(row)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDelete(row)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden border-b border-farm-600/30 px-5 py-4 md:block">
        <div className="text-sm font-medium text-foreground">Market Price Records</div>
        <div className="text-xs text-farm-muted">Recorded prices used by selling predictions.</div>
      </div>

      <table className="hidden w-full min-w-275 text-sm md:table">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Date</th>
            <th className="px-5 py-3 text-left font-medium">Species</th>
            <th className="px-5 py-3 text-left font-medium">Source</th>
            <th className="px-5 py-3 text-left font-medium">Price / Kg</th>
            <th className="px-5 py-3 text-left font-medium">Basis</th>
            <th className="px-5 py-3 text-left font-medium">Weight Range</th>
            <th className="px-5 py-3 text-left font-medium">Grade</th>
            <th className="px-5 py-3 text-left font-medium">Notes</th>
            <th className="px-5 py-3 text-left font-medium">Recorded By</th>
            <th className="px-5 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-farm-600/30">
              <td className="px-5 py-3">{new Date(row.recordedAt).toLocaleDateString()}</td>
              <td className="px-5 py-3 font-medium">{row.speciesName}</td>
              <td className="px-5 py-3">{row.sourceName}</td>
              <td className="px-5 py-3">{formatMoney(row.pricePerKg, row.currency, "/kg")}</td>
              <td className="px-5 py-3 capitalize">{formatBasis(row.priceBasis)}</td>
              <td className="px-5 py-3">{formatWeightRange(row.weightMinKg, row.weightMaxKg)}</td>
              <td className="px-5 py-3 text-farm-muted">{row.qualityGrade ?? "-"}</td>
              <td className="px-5 py-3 text-farm-muted">{row.notes ?? "-"}</td>
              <td className="px-5 py-3 text-farm-muted">{row.recordedBy ?? "-"}</td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-3 text-sm text-farm-muted sm:p-5">No market prices found.</div>
      )}
    </div>
  );
}
