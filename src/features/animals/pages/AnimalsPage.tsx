import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { AnimalFilters } from "../components/AnimalFilters";
import { AnimalForm } from "../components/AnimalForm";
import { AnimalSummaryCard } from "../components/AnimalSummaryCard";
import { AnimalTable } from "../components/AnimalTable";
import { useAnimalBreeds } from "../hooks/useAnimalBreeds";
import { useAnimals } from "../hooks/useAnimals";
import { useAnimalSpecies } from "../hooks/useAnimalSpecies";
import { useDeleteAnimal } from "../hooks/useDeleteAnimal";
import { useUpdateAnimal } from "../hooks/useUpdateAnimal";
import type {
  AnimalFilters as AnimalFiltersValue,
  AnimalStatus,
  AnimalViewModel,
} from "../types/animal.types";

export function AnimalsPage() {
  const navigate = useNavigate();
  const { currentFarm } = useCurrentFarm();
  const [filters, setFilters] = useState<AnimalFiltersValue>({
    status: "all",
    performance: "all",
    sex: "all",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<AnimalViewModel | null>(null);

  const speciesQuery = useAnimalSpecies();
  const breedsQuery = useAnimalBreeds(filters.speciesId);
  const animalsQuery = useAnimals(currentFarm.id, filters);
  const updateAnimal = useUpdateAnimal(currentFarm.id);
  const deleteAnimal = useDeleteAnimal(currentFarm.id);
  const summary = animalsQuery.data?.summary;

  const onChangeStatus = async (animal: AnimalViewModel, status: AnimalStatus) => {
    try {
      await updateAnimal.mutateAsync({
        farmId: currentFarm.id,
        animalId: animal.id,
        status,
      });
      toast.success(`Animal status changed to ${status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not change animal status";
      toast.error(message);
    }
  };

  const onDeleteAnimal = async (animal: AnimalViewModel) => {
    const confirmed = window.confirm(
      `Delete animal ${animal.tagNumber} from the database? This will also remove related records that cascade from the animal.`,
    );
    if (!confirmed) return;

    try {
      await deleteAnimal.mutateAsync(animal.id);
      toast.success("Animal deleted and audit log recorded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete animal";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          title="Animals"
          description="Manage livestock across cattle, pigs, and goats."
        />
        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 sm:w-auto"
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

      <Dialog
        open={Boolean(editingAnimal)}
        onOpenChange={(open) => !open && setEditingAnimal(null)}
      >
        <DialogContent className="h-[92vh] w-[calc(100vw-0.75rem)] max-w-5xl overflow-y-auto bg-farm-900 p-4 sm:h-auto sm:max-h-[90vh] sm:w-full sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit animal details</DialogTitle>
            <DialogDescription>
              Changes are written to the animal record and recorded in the farm audit log.
            </DialogDescription>
          </DialogHeader>
          {editingAnimal && (
            <AnimalForm
              farmId={currentFarm.id}
              species={speciesQuery.data ?? []}
              animal={editingAnimal}
              onCancel={() => setEditingAnimal(null)}
              onUpdated={() => {
                setEditingAnimal(null);
                toast.success("Animal details updated");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-6">
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
          onViewAnimal={(animalId) => navigate({ to: "/animals/$id", params: { id: animalId } })}
          onEditAnimal={setEditingAnimal}
          onChangeStatus={onChangeStatus}
          onDeleteAnimal={onDeleteAnimal}
        />
      )}
    </div>
  );
}
