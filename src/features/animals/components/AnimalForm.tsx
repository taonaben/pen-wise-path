import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getSpeciesConfig } from "../config/speciesConfig";
import { useAnimalBreeds } from "../hooks/useAnimalBreeds";
import { useCreateAnimal } from "../hooks/useCreateAnimal";
import type { AnimalAcquisitionMethod, AnimalSex, AnimalSpecies } from "../types/animal.types";

type Props = {
  farmId: string;
  species: AnimalSpecies[];
  onCancel: () => void;
  onCreated: (animalId: string) => void;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-farm-600/60 bg-farm-900/70 px-3 text-sm outline-none focus:border-farm-lime";
const labelClass = "block space-y-2 text-sm";
const labelTextClass = "block text-xs font-medium uppercase tracking-wide text-farm-muted";

export function AnimalForm({ farmId, species, onCancel, onCreated }: Props) {
  const [speciesId, setSpeciesId] = useState("");
  const [breedId, setBreedId] = useState("");
  const [tagNumber, setTagNumber] = useState("");
  const [sex, setSex] = useState<AnimalSex>("male");
  const [acquisitionMethod, setAcquisitionMethod] = useState<AnimalAcquisitionMethod>("purchased");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [purchaseWeightKg, setPurchaseWeightKg] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");

  const createAnimal = useCreateAnimal(farmId);
  const selectedSpecies = useMemo(
    () => species.find((item) => item.id === speciesId) ?? species[0],
    [species, speciesId],
  );
  const selectedConfig = getSpeciesConfig(selectedSpecies?.slug);
  const breedsQuery = useAnimalBreeds(selectedSpecies?.id);

  useEffect(() => {
    if (!speciesId && species[0]) setSpeciesId(species[0].id);
  }, [species, speciesId]);

  useEffect(() => {
    setBreedId("");
  }, [speciesId]);

  const canSubmit =
    Boolean(speciesId && tagNumber.trim() && purchaseDate) &&
    Number(purchaseWeightKg) > 0 &&
    (acquisitionMethod === "bred_in_house"
      ? purchasePrice === "" || Number(purchasePrice) >= 0
      : purchasePrice !== "" && Number(purchasePrice) >= 0) &&
    !createAnimal.isPending;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const created = await createAnimal.mutateAsync({
      farmId,
      speciesId,
      breedId: breedId || null,
      tagNumber,
      sex,
      acquisitionMethod,
      purchaseDate,
      purchaseWeightKg: Number(purchaseWeightKg),
      purchasePrice: Number(purchasePrice || 0),
      notes,
      metadata: {},
    });

    onCreated(created.id);
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-farm-800/90 p-6">
      <div className="mb-6 grid gap-3 border-b border-farm-600/40 pb-5 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="text-lg font-semibold">Add Animal</h2>
          <p className="text-sm text-farm-muted">
            Create a livestock record and starting weight entry.
          </p>
        </div>
        <div className="rounded-lg border border-farm-600/50 px-3 py-2 text-xs text-farm-muted">
          Target {selectedConfig.sellingWeightRangeKg.min}-{selectedConfig.sellingWeightRangeKg.max}{" "}
          kg
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className={labelClass}>
          <span className={labelTextClass}>Species</span>
          <select
            className={fieldClass}
            value={speciesId}
            onChange={(event) => setSpeciesId(event.target.value)}
            required
          >
            {species.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Breed</span>
          <select
            className={fieldClass}
            value={breedId}
            onChange={(event) => setBreedId(event.target.value)}
            disabled={!selectedSpecies || breedsQuery.isLoading}
          >
            <option value="">Unspecified</option>
            {(breedsQuery.data ?? []).map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Source</span>
          <select
            className={fieldClass}
            value={acquisitionMethod}
            onChange={(event) =>
              setAcquisitionMethod(event.target.value as AnimalAcquisitionMethod)
            }
          >
            <option value="purchased">Purchased</option>
            <option value="bred_in_house">Bred in-house</option>
          </select>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Sex</span>
          <select
            className={fieldClass}
            value={sex}
            onChange={(event) => setSex(event.target.value as AnimalSex)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>Tag number</span>
          <input
            className={fieldClass}
            value={tagNumber}
            placeholder={selectedConfig.tagPlaceholder}
            onChange={(event) => setTagNumber(event.target.value)}
            required
          />
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>
            {acquisitionMethod === "bred_in_house" ? "Pen entry date" : "Purchase date"}
          </span>
          <input
            className={fieldClass}
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
            required
          />
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>
            {acquisitionMethod === "bred_in_house" ? "Entry weight (kg)" : "Purchase weight (kg)"}
          </span>
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={purchaseWeightKg}
            onChange={(event) => setPurchaseWeightKg(event.target.value)}
            required
          />
        </label>

        <label className={labelClass}>
          <span className={labelTextClass}>
            {acquisitionMethod === "bred_in_house" ? "Initial value" : "Purchase price"}
          </span>
          <input
            className={fieldClass}
            type="number"
            min="0"
            step="0.01"
            value={purchasePrice}
            placeholder={acquisitionMethod === "bred_in_house" ? "0.00 optional" : "0.00"}
            onChange={(event) => setPurchasePrice(event.target.value)}
            required={acquisitionMethod === "purchased"}
          />
        </label>

        <label className={`${labelClass} md:col-span-4`}>
          <span className={labelTextClass}>Notes</span>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-farm-600/60 bg-farm-900/70 px-3 py-2 text-sm outline-none focus:border-farm-lime"
            value={notes}
            placeholder={
              acquisitionMethod === "bred_in_house"
                ? "Optional internal breeding or pen-entry notes"
                : "Optional purchase, supplier, or transport notes"
            }
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {createAnimal.isError && (
        <div className="mt-4 rounded-lg border border-farm-danger/30 bg-farm-danger/10 p-3 text-sm text-farm-danger">
          Animal could not be created. Check the form values and database migration.
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-lg border border-farm-600/60 px-4 text-sm text-farm-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="h-10 rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createAnimal.isPending ? "Creating..." : "Create Animal"}
        </button>
      </div>
    </form>
  );
}
