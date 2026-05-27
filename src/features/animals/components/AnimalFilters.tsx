import type { ChangeEvent } from "react";
import type {
  AnimalBreed,
  AnimalFilters as AnimalFiltersValue,
  AnimalSpecies,
} from "../types/animal.types";

type Props = {
  filters: AnimalFiltersValue;
  species: AnimalSpecies[];
  breeds: AnimalBreed[];
  onChange: (filters: AnimalFiltersValue) => void;
};

const inputClass =
  "h-10 rounded-lg border border-farm-600/60 bg-farm-900/70 px-3 text-sm outline-none focus:border-farm-lime";

export function AnimalFilters({ filters, species, breeds, onChange }: Props) {
  const setFilter =
    (key: keyof AnimalFiltersValue) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ ...filters, [key]: event.target.value || undefined });
    };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-farm-800/80 p-4 md:grid-cols-6">
      <input
        className={`${inputClass} md:col-span-2`}
        placeholder="Search tag, breed, species..."
        value={filters.search ?? ""}
        onChange={setFilter("search")}
      />
      <select
        className={inputClass}
        value={filters.speciesId ?? ""}
        onChange={setFilter("speciesId")}
      >
        <option value="">All species</option>
        {species.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select className={inputClass} value={filters.breedId ?? ""} onChange={setFilter("breedId")}>
        <option value="">All breeds</option>
        {breeds.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <select className={inputClass} value={filters.status ?? "all"} onChange={setFilter("status")}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="sick">Sick</option>
        <option value="sold">Sold</option>
        <option value="removed">Removed</option>
        <option value="dead">Dead</option>
      </select>
      <select
        className={inputClass}
        value={filters.performance ?? "all"}
        onChange={setFilter("performance")}
      >
        <option value="all">All performance</option>
        <option value="Critical">Critical</option>
        <option value="Underperforming">Underperforming</option>
        <option value="Normal">Normal</option>
        <option value="Excellent">Excellent</option>
        <option value="Unknown">Unknown</option>
      </select>
      <select className={inputClass} value={filters.sex ?? "all"} onChange={setFilter("sex")}>
        <option value="all">All sex</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>
  );
}
