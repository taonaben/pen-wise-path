import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { AnimalFilters } from "../components/AnimalFilters";
import { AnimalForm } from "../components/AnimalForm";
import { AnimalSummaryCard } from "../components/AnimalSummaryCard";
import { AnimalTable } from "../components/AnimalTable";
import { useAnimalBreeds } from "../hooks/useAnimalBreeds";
import { useAnimals } from "../hooks/useAnimals";
import { useAnimalSpecies } from "../hooks/useAnimalSpecies";
import type { AnimalFilters as AnimalFiltersValue } from "../types/animal.types";

export function AnimalsPage() {
  const navigate = useNavigate();
  const { currentFarm } = useCurrentFarm();
  const [filters, setFilters] = useState<AnimalFiltersValue>({
    status: "all",
    performance: "all",
    sex: "all",
  });
  const [showForm, setShowForm] = useState(false);

  const speciesQuery = useAnimalSpecies();
  const breedsQuery = useAnimalBreeds(filters.speciesId);
  const animalsQuery = useAnimals(currentFarm.id, filters);
  const summary = animalsQuery.data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          title="Animals"
          description="Manage livestock across cattle, pigs, and goats."
        />
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950"
        >
          <Plus className="h-4 w-4" />
          Add Animal
        </button>
      </div>

      {showForm && (
        <AnimalForm
          farmId={currentFarm.id}
          species={speciesQuery.data ?? []}
          onCancel={() => setShowForm(false)}
          onCreated={(animalId) => {
            setShowForm(false);
            navigate({ to: "/animals/$id", params: { id: animalId } });
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AnimalSummaryCard title="Total Animals" value={summary?.total ?? 0} />
        <AnimalSummaryCard title="Cattle" value={summary?.cattle ?? 0} />
        <AnimalSummaryCard title="Pigs" value={summary?.pigs ?? 0} />
        <AnimalSummaryCard title="Goats" value={summary?.goats ?? 0} />
        <AnimalSummaryCard
          title="Underperforming"
          value={summary?.underperforming ?? 0}
          variant={(summary?.underperforming ?? 0) > 0 ? "warning" : "default"}
        />
        <AnimalSummaryCard
          title="Ready for Sale"
          value={summary?.readyForSale ?? 0}
          variant="success"
        />
      </div>

      <AnimalFilters
        filters={filters}
        species={speciesQuery.data ?? []}
        breeds={breedsQuery.data ?? []}
        onChange={(nextFilters) =>
          setFilters((currentFilters) => ({
            ...nextFilters,
            breedId:
              nextFilters.speciesId !== currentFilters.speciesId ? undefined : nextFilters.breedId,
          }))
        }
      />

      {animalsQuery.isError ? (
        <div className="rounded-2xl border border-farm-danger/30 bg-farm-danger/10 p-6 text-sm text-farm-danger">
          Animals could not be loaded. Confirm the multi-species migration has been applied.
        </div>
      ) : (
        <AnimalTable
          animals={animalsQuery.data?.animals ?? []}
          isLoading={animalsQuery.isLoading}
        />
      )}
    </div>
  );
}
