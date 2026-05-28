import { Input } from "@/components/ui/input";
import type { AnimalSpecies } from "@/features/animals/types/animal.types";
import type { MarketPriceFilters, MarketSource, PriceBasis } from "../types/market.types";

type Props = {
  filters: MarketPriceFilters;
  species: AnimalSpecies[];
  sources: MarketSource[];
  onChange: (filters: MarketPriceFilters) => void;
};

const basisOptions: PriceBasis[] = ["live_weight", "carcass_weight", "per_head"];

export function MarketPriceFilters({ filters, species, sources, onChange }: Props) {
  const setFilter = (patch: Partial<MarketPriceFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border bg-farm-800/80 p-4 md:grid-cols-3 xl:grid-cols-6">
      <select
        className="h-9 rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={filters.speciesId ?? ""}
        onChange={(event) => setFilter({ speciesId: event.target.value || undefined })}
      >
        {species.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={filters.marketSourceId ?? ""}
        onChange={(event) => setFilter({ marketSourceId: event.target.value || undefined })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          All sources
        </option>
        {sources.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={filters.priceBasis ?? "live_weight"}
        onChange={(event) => setFilter({ priceBasis: event.target.value as PriceBasis })}
      >
        {basisOptions.map((basis) => (
          <option key={basis} value={basis} className="bg-farm-900 text-foreground">
            {basis.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <Input
        value={filters.currency ?? "USD"}
        onChange={(event) => setFilter({ currency: event.target.value.toUpperCase() || undefined })}
        placeholder="Currency"
      />
      <Input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(event) => setFilter({ dateFrom: event.target.value || undefined })}
      />
      <Input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(event) => setFilter({ dateTo: event.target.value || undefined })}
      />
    </div>
  );
}
