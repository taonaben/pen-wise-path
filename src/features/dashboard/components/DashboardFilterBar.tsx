import type { AnimalSpecies, Pen } from "@/features/animals/types/animal.types";
import type { DashboardFilters } from "../types";

type Props = {
  filters: DashboardFilters;
  species: AnimalSpecies[];
  pens: Pen[];
  onFiltersChange: (next: DashboardFilters) => void;
};

export function DashboardFilterBar({ filters, species, pens, onFiltersChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2.5 rounded-2xl border bg-farm-800/70 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
      <label className="space-y-1 text-xs sm:text-sm">
        <span className="text-farm-muted">Start Date</span>
        <input
          type="date"
          className="h-10 w-full rounded-lg border border-farm-600/40 bg-farm-900/60 px-3 text-sm"
          value={filters.startDate}
          onChange={(event) => onFiltersChange({ ...filters, startDate: event.target.value })}
        />
      </label>

      <label className="space-y-1 text-xs sm:text-sm">
        <span className="text-farm-muted">End Date</span>
        <input
          type="date"
          className="h-10 w-full rounded-lg border border-farm-600/40 bg-farm-900/60 px-3 text-sm"
          value={filters.endDate}
          onChange={(event) => onFiltersChange({ ...filters, endDate: event.target.value })}
        />
      </label>

      <label className="space-y-1 text-xs sm:text-sm">
        <span className="text-farm-muted">Species</span>
        <select
          className="h-10 w-full rounded-lg border border-farm-600/40 bg-farm-900/60 px-3 text-sm"
          value={filters.speciesId ?? "all"}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              speciesId: event.target.value === "all" ? undefined : event.target.value,
            })
          }
        >
          <option value="all">All species</option>
          {species.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-xs sm:text-sm">
        <span className="text-farm-muted">Pen</span>
        <select
          className="h-10 w-full rounded-lg border border-farm-600/40 bg-farm-900/60 px-3 text-sm"
          value={filters.penId ?? "all"}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              penId: event.target.value === "all" ? undefined : event.target.value,
            })
          }
        >
          <option value="all">All pens</option>
          {pens.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
