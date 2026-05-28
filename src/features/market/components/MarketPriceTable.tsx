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
    <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 px-5 py-4">
        <div className="text-sm font-medium text-foreground">Market Price Records</div>
        <div className="text-xs text-farm-muted">Recorded prices used by selling predictions.</div>
      </div>
      <table className="w-full min-w-275 text-sm">
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
                  <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(row)}>
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-5 text-sm text-farm-muted">No market prices found.</div>}
    </div>
  );
}
