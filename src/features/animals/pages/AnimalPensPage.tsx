import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimals } from "../hooks/useAnimals";
import { useAnimalSpecies } from "../hooks/useAnimalSpecies";
import { usePenActions, usePenManagement } from "../hooks/usePenManagement";
import type { AnimalFilters } from "../types/animal.types";

const defaultFilters: AnimalFilters = {
  status: "all",
  performance: "all",
  sex: "all",
};

type NewPenForm = {
  name: string;
  speciesId: string;
  capacity: string;
  status: "active" | "inactive" | "maintenance";
  notes: string;
};

const emptyPenForm: NewPenForm = {
  name: "",
  speciesId: "",
  capacity: "",
  status: "active",
  notes: "",
};

export function AnimalPensPage() {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const animalsQuery = useAnimals(currentFarm.id, defaultFilters);
  const pensQuery = usePenManagement(currentFarm.id);
  const actions = usePenActions(currentFarm.id);

  const [newPenOpen, setNewPenOpen] = useState(false);
  const [newPenForm, setNewPenForm] = useState<NewPenForm>(emptyPenForm);

  const pens = pensQuery.data?.pens ?? [];
  const assignments = pensQuery.data?.assignments ?? [];
  const animals = animalsQuery.data?.animals ?? [];
  const presentAnimals = useMemo(
    () => animals.filter((animal) => ["active", "sick"].includes(animal.status)),
    [animals],
  );

  const currentPenByAnimal = useMemo(() => {
    const map = new Map<string, string>();
    for (const assignment of assignments) {
      map.set(assignment.animal_id, assignment.pen_id);
    }
    return map;
  }, [assignments]);

  const occupancyByPen = useMemo(() => {
    const map = new Map<string, number>();
    for (const assignment of assignments) {
      map.set(assignment.pen_id, (map.get(assignment.pen_id) ?? 0) + 1);
    }
    return map;
  }, [assignments]);

  const speciesLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const species of speciesQuery.data ?? []) {
      map.set(species.id, species.name);
    }
    return map;
  }, [speciesQuery.data]);

  const onCreatePen = async () => {
    if (!newPenForm.name.trim()) {
      toast.error("Pen name is required");
      return;
    }

    const capacity = newPenForm.capacity.trim() === "" ? null : Number(newPenForm.capacity);
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
      toast.error("Capacity must be a valid non-negative number");
      return;
    }

    try {
      await actions.createPen.mutateAsync({
        farmId: currentFarm.id,
        name: newPenForm.name,
        speciesId: newPenForm.speciesId || null,
        capacity,
        status: newPenForm.status,
        notes: newPenForm.notes || null,
      });
      toast.success("Pen created");
      setNewPenForm(emptyPenForm);
      setNewPenOpen(false);
    } catch {
      toast.error("Could not create pen");
    }
  };

  const onAssignAnimal = async (animalId: string, nextPenId: string) => {
    try {
      if (!nextPenId) {
        await actions.clearAnimalAssignment.mutateAsync({ farmId: currentFarm.id, animalId });
        toast.success("Animal removed from pen");
        return;
      }

      await actions.assignAnimal.mutateAsync({
        farmId: currentFarm.id,
        animalId,
        penId: nextPenId,
      });
      toast.success("Animal assigned to pen");
    } catch {
      toast.error("Could not update pen assignment");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pens"
        description="Assign animals to pens and monitor occupancy by group."
        action={
          <Dialog open={newPenOpen} onOpenChange={setNewPenOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90">
                Add Pen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Pen</DialogTitle>
                <DialogDescription>
                  Add a pen/group to organize animals for feeding and monitoring.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Input
                  value={newPenForm.name}
                  onChange={(event) =>
                    setNewPenForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Pen name"
                />

                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                  value={newPenForm.speciesId}
                  onChange={(event) =>
                    setNewPenForm((current) => ({ ...current, speciesId: event.target.value }))
                  }
                >
                  <option value="" className="bg-farm-900 text-foreground">
                    All species
                  </option>
                  {(speciesQuery.data ?? []).map((species) => (
                    <option
                      key={species.id}
                      value={species.id}
                      className="bg-farm-900 text-foreground"
                    >
                      {species.name}
                    </option>
                  ))}
                </select>

                <Input
                  value={newPenForm.capacity}
                  onChange={(event) =>
                    setNewPenForm((current) => ({ ...current, capacity: event.target.value }))
                  }
                  type="number"
                  min={0}
                  step="1"
                  placeholder="Capacity"
                />

                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                  value={newPenForm.status}
                  onChange={(event) =>
                    setNewPenForm((current) => ({
                      ...current,
                      status: event.target.value as NewPenForm["status"],
                    }))
                  }
                >
                  <option value="active" className="bg-farm-900 text-foreground">
                    Active
                  </option>
                  <option value="inactive" className="bg-farm-900 text-foreground">
                    Inactive
                  </option>
                  <option value="maintenance" className="bg-farm-900 text-foreground">
                    Maintenance
                  </option>
                </select>

                <Input
                  value={newPenForm.notes}
                  onChange={(event) =>
                    setNewPenForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Notes (optional)"
                />
              </div>

              <DialogFooter>
                <Button type="button" onClick={onCreatePen} disabled={actions.createPen.isPending}>
                  {actions.createPen.isPending ? "Saving..." : "Save Pen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Total Pens</div>
          <div className="mt-2 text-xl font-semibold">{pens.length}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Assigned Animals</div>
          <div className="mt-2 text-xl font-semibold">{assignments.length}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Unassigned Animals</div>
          <div className="mt-2 text-xl font-semibold">
            {Math.max(presentAnimals.length - assignments.length, 0)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-200 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Pen</th>
              <th className="px-5 py-3 text-left font-medium">Species</th>
              <th className="px-5 py-3 text-left font-medium">Occupancy</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {pens.map((pen) => {
              const occupancy = occupancyByPen.get(pen.id) ?? 0;
              const capacity = pen.capacity === null ? "-" : String(pen.capacity);
              return (
                <tr key={pen.id} className="border-t border-farm-600/30">
                  <td className="px-5 py-3 font-medium">{pen.name}</td>
                  <td className="px-5 py-3 text-farm-muted">
                    {pen.species_id ? (speciesLabelById.get(pen.species_id) ?? "-") : "All"}
                  </td>
                  <td className="px-5 py-3">{`${occupancy}${capacity === "-" ? "" : ` / ${capacity}`}`}</td>
                  <td className="px-5 py-3 capitalize">{pen.status}</td>
                  <td className="px-5 py-3 text-farm-muted">{pen.notes ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!pensQuery.isLoading && pens.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">No pens found for this farm.</div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-245 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Animal</th>
              <th className="px-5 py-3 text-left font-medium">Species</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Current Pen</th>
              <th className="px-5 py-3 text-left font-medium">Assign</th>
            </tr>
          </thead>
          <tbody>
            {presentAnimals.map((animal) => {
              const currentPenId = currentPenByAnimal.get(animal.id) ?? "";
              return (
                <tr key={animal.id} className="border-t border-farm-600/30">
                  <td className="px-5 py-3 font-medium">{animal.tagNumber}</td>
                  <td className="px-5 py-3 text-farm-muted">{animal.speciesLabel}</td>
                  <td className="px-5 py-3 text-farm-muted">{animal.statusLabel}</td>
                  <td className="px-5 py-3 text-farm-muted">
                    {currentPenId
                      ? (pens.find((pen) => pen.id === currentPenId)?.name ?? "-")
                      : "-"}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                      value={currentPenId}
                      onChange={(event) => onAssignAnimal(animal.id, event.target.value)}
                    >
                      <option value="" className="bg-farm-900 text-foreground">
                        Unassigned
                      </option>
                      {pens.map((pen) => (
                        <option key={pen.id} value={pen.id} className="bg-farm-900 text-foreground">
                          {pen.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {animalsQuery.isLoading && (
          <div className="p-5 text-sm text-farm-muted">Loading animals...</div>
        )}
        {!animalsQuery.isLoading && presentAnimals.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">No active animals found for this farm.</div>
        )}
      </div>
    </div>
  );
}
