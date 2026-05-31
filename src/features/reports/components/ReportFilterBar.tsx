import { Input } from "@/components/ui/input";
import type { AnimalStatus } from "@/features/animals/types/animal.types";
import type { ReportDatePreset, ReportFilterOptions, ReportFilters } from "../types/report.types";

type Props = {
  filters: ReportFilters;
  datePreset: ReportDatePreset;
  options: ReportFilterOptions;
  onPresetChange: (preset: ReportDatePreset) => void;
  onFiltersChange: (next: ReportFilters) => void;
};

const statuses: Array<AnimalStatus | "all"> = ["all", "active", "sold", "sick", "removed", "dead"];

export function ReportFilterBar({
  filters,
  datePreset,
  options,
  onPresetChange,
  onFiltersChange,
}: Props) {
  const patchFilters = (patch: Partial<ReportFilters>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-farm-800/80 p-4 md:grid-cols-2 xl:grid-cols-6">
      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={datePreset}
        onChange={(event) => onPresetChange(event.target.value as ReportDatePreset)}
      >
        <option value="7" className="bg-farm-900 text-foreground">
          Last 7 days
        </option>
        <option value="30" className="bg-farm-900 text-foreground">
          Last 30 days
        </option>
        <option value="90" className="bg-farm-900 text-foreground">
          Last 90 days
        </option>
        <option value="month" className="bg-farm-900 text-foreground">
          This month
        </option>
        <option value="custom" className="bg-farm-900 text-foreground">
          Custom range
        </option>
      </select>

      <Input
        type="date"
        value={filters.startDate}
        onChange={(event) => {
          onPresetChange("custom");
          patchFilters({ startDate: event.target.value });
        }}
      />
      <Input
        type="date"
        value={filters.endDate}
        onChange={(event) => {
          onPresetChange("custom");
          patchFilters({ endDate: event.target.value });
        }}
      />

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.speciesId ?? ""}
        onChange={(event) => patchFilters({ speciesId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All species
        </option>
        {options.species.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.penId ?? ""}
        onChange={(event) => patchFilters({ penId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All pens
        </option>
        {options.pens.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.animalStatus}
        onChange={(event) =>
          patchFilters({ animalStatus: event.target.value as AnimalStatus | "all" })
        }
      >
        {statuses.map((status) => (
          <option key={status} value={status} className="bg-farm-900 text-foreground">
            {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
