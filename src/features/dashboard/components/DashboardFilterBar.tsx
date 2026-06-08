import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnimalSpecies, Pen } from "@/features/animals/types/animal.types";
import { cn } from "@/lib/utils";
import type { DashboardFilters } from "../types";

type Props = {
  filters: DashboardFilters;
  species: AnimalSpecies[];
  pens: Pen[];
  onFiltersChange: (next: DashboardFilters) => void;
};

export function DashboardFilterBar({ filters, species, pens, onFiltersChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount = [filters.speciesId, filters.penId].filter(Boolean).length;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="flex w-full justify-between md:hidden"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-farm-lime/15 px-2 py-0.5 text-xs text-farm-lime">
              {activeFilterCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      <div
        className={cn(
          "grid-cols-1 gap-2.5 rounded-2xl border bg-farm-800/70 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4",
          isOpen ? "grid" : "hidden md:grid",
        )}
      >
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
    </div>
  );
}
