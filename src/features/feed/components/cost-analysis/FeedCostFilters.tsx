import { Input } from "@/components/ui/input";
import type { AnimalSpecies, AnimalStatus, Pen } from "@/features/animals/types/animal.types";
import type { FeedType } from "../../types/feed.types";
import type { FeedCostAnalysisFilters } from "../../types/feedCostAnalysis.types";

type DatePreset = "7" | "30" | "90" | "month" | "custom";

type Props = {
  filters: FeedCostAnalysisFilters;
  datePreset: DatePreset;
  feedTypes: FeedType[];
  species: AnimalSpecies[];
  pens: Pen[];
  onPresetChange: (preset: DatePreset) => void;
  onFiltersChange: (filters: FeedCostAnalysisFilters) => void;
};

const animalStatuses: Array<AnimalStatus | "all"> = ["all", "active", "sold", "sick", "removed", "dead"];

export function FeedCostFilters({
  filters,
  datePreset,
  feedTypes,
  species,
  pens,
  onPresetChange,
  onFiltersChange,
}: Props) {
  const setFilter = (patch: Partial<FeedCostAnalysisFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-farm-800/80 p-4 md:grid-cols-3 xl:grid-cols-6">
      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={datePreset}
        onChange={(event) => onPresetChange(event.target.value as DatePreset)}
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
          setFilter({ startDate: event.target.value });
        }}
      />
      <Input
        type="date"
        value={filters.endDate}
        onChange={(event) => {
          onPresetChange("custom");
          setFilter({ endDate: event.target.value });
        }}
      />

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.speciesId ?? ""}
        onChange={(event) => setFilter({ speciesId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All species
        </option>
        {species.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.feedTypeId ?? ""}
        onChange={(event) => setFilter({ feedTypeId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All feed types
        </option>
        {feedTypes.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
        value={filters.penId ?? ""}
        onChange={(event) => setFilter({ penId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All pens
        </option>
        {pens.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground md:col-span-3 xl:col-span-1"
        value={filters.animalStatus ?? "all"}
        onChange={(event) =>
          setFilter({ animalStatus: event.target.value as AnimalStatus | "all" })
        }
      >
        {animalStatuses.map((status) => (
          <option key={status} value={status} className="bg-farm-900 text-foreground">
            {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

export type { DatePreset };
