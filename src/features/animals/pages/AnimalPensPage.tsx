import { useEffect, useMemo, useState } from "react";
import { CircleDot, LayoutGrid, PawPrint, Users } from "lucide-react";
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
import { StatCard } from "@/shared/components/ui/StatCard";
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
  const [selectedPenId, setSelectedPenId] = useState<string>("");

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

  const animalsById = useMemo(() => {
    const map = new Map<string, (typeof presentAnimals)[number]>();
    for (const animal of presentAnimals) {
      map.set(animal.id, animal);
    }
    return map;
  }, [presentAnimals]);

  const selectedPen = useMemo(
    () => pens.find((pen) => pen.id === selectedPenId) ?? null,
    [pens, selectedPenId],
  );

  const animalsInSelectedPen = useMemo(() => {
    if (!selectedPenId) return [];

    return assignments
      .filter((assignment) => assignment.pen_id === selectedPenId)
      .map((assignment) => animalsById.get(assignment.animal_id))
      .filter((animal): animal is NonNullable<typeof animal> => Boolean(animal));
  }, [assignments, animalsById, selectedPenId]);

  useEffect(() => {
    if (pens.length === 0) {
      setSelectedPenId("");
      return;
    }

    if (!pens.some((pen) => pen.id === selectedPenId)) {
      setSelectedPenId(pens[0]!.id);
    }
  }, [pens, selectedPenId]);

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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <StatCard
          title="Total Pens"
          value={String(pens.length)}
          icon={<LayoutGrid className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Assigned Animals"
          value={String(assignments.length)}
          icon={<Users className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Unassigned Animals"
          value={String(Math.max(presentAnimals.length - assignments.length, 0))}
          icon={<PawPrint className="h-4 w-4" />}
          density="compact"
        />
      </div>

      <div className="space-y-2 md:hidden">
        {pens.map((pen) => {
          const occupancy = occupancyByPen.get(pen.id) ?? 0;
          const capacityLabel = pen.capacity === null ? "-" : String(pen.capacity);
          const selected = pen.id === selectedPenId;

          return (
            <button
              key={pen.id}
              type="button"
              onClick={() => setSelectedPenId(pen.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-farm-lime/60 bg-farm-700/40"
                  : "border-farm-600/30 bg-farm-800/80 hover:bg-farm-800"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-foreground">{pen.name}</div>
                  <div className="mt-1 text-xs text-farm-muted">
                    {pen.species_id ? (speciesLabelById.get(pen.species_id) ?? "-") : "All species"}
                  </div>
                </div>
                <span className="rounded-full bg-farm-900/50 px-2 py-1 text-xs capitalize text-foreground">
                  {pen.status}
                </span>
              </div>
              <div className="mt-3 text-xs text-farm-muted">Occupancy</div>
              <div className="font-medium text-foreground">
                {`${occupancy}${capacityLabel === "-" ? "" : ` / ${capacityLabel}`}`}
              </div>
            </button>
          );
        })}

        {!pensQuery.isLoading && pens.length === 0 && (
          <div className="rounded-xl border bg-farm-800/80 p-4 text-sm text-farm-muted">
            No pens found for this farm.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-farm-800/80 md:block">
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
                <tr
                  key={pen.id}
                  tabIndex={0}
                  onClick={() => setSelectedPenId(pen.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPenId(pen.id);
                    }
                  }}
                  className={`cursor-pointer border-t border-farm-600/30 outline-none transition-colors hover:bg-farm-700/30 focus-visible:bg-farm-700/30 ${
                    pen.id === selectedPenId ? "bg-farm-700/30" : ""
                  }`}
                >
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

      <div className="rounded-xl border bg-farm-800/80 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-foreground">
            {selectedPen ? `Animals in ${selectedPen.name}` : "Animals by Pen"}
          </div>
          <div className="text-xs text-farm-muted">{animalsInSelectedPen.length} animals</div>
        </div>

        {!selectedPen && !pensQuery.isLoading && (
          <div className="rounded-lg border border-farm-600/30 bg-farm-900/35 p-3 text-sm text-farm-muted">
            Select a pen above to view animals assigned to it.
          </div>
        )}

        {selectedPen && (
          <>
            <div className="space-y-2 md:hidden">
              {animalsInSelectedPen.map((animal) => (
                <div
                  key={animal.id}
                  className="rounded-xl border border-farm-600/35 bg-farm-900/45 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-foreground">{animal.tagNumber}</div>
                      <div className="mt-1 text-xs text-farm-muted">
                        {animal.speciesLabel} • {animal.breedLabel}
                      </div>
                    </div>
                    <span className="rounded-full bg-farm-700/50 px-2 py-1 text-xs text-foreground">
                      {animal.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-200 text-sm">
                <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Animal</th>
                    <th className="px-4 py-2 text-left font-medium">Species</th>
                    <th className="px-4 py-2 text-left font-medium">Breed</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {animalsInSelectedPen.map((animal) => (
                    <tr key={animal.id} className="border-t border-farm-600/30">
                      <td className="px-4 py-2 font-medium">{animal.tagNumber}</td>
                      <td className="px-4 py-2 text-farm-muted">{animal.speciesLabel}</td>
                      <td className="px-4 py-2 text-farm-muted">{animal.breedLabel}</td>
                      <td className="px-4 py-2 text-farm-muted">{animal.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!animalsQuery.isLoading && selectedPen && animalsInSelectedPen.length === 0 && (
          <div className="mt-2 rounded-lg border border-farm-600/30 bg-farm-900/35 p-3 text-sm text-farm-muted">
            No active animals are currently assigned to this pen.
          </div>
        )}

        {animalsQuery.isLoading && (
          <div className="mt-2 text-sm text-farm-muted">Loading animals...</div>
        )}
      </div>
    </div>
  );
}
