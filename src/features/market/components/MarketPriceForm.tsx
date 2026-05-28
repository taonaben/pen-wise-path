import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnimalSpecies } from "@/features/animals/types/animal.types";
import type {
  MarketPricePayload,
  MarketPriceViewModel,
  MarketSource,
  PriceBasis,
} from "../types/market.types";

type Props = {
  farmId: string;
  species: AnimalSpecies[];
  sources: MarketSource[];
  initialPrice?: MarketPriceViewModel | null;
  defaultSpeciesId?: string;
  onSubmit: (payload: MarketPricePayload) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  speciesId: string;
  marketSourceId: string;
  pricePerKg: string;
  currency: string;
  priceBasis: PriceBasis;
  recordedAt: string;
  qualityGrade: string;
  weightMinKg: string;
  weightMaxKg: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

export function MarketPriceForm({
  farmId,
  species,
  sources,
  initialPrice,
  defaultSpeciesId,
  onSubmit,
  onCancel,
}: Props) {
  const [form, setForm] = useState<FormState>({
    speciesId: defaultSpeciesId ?? "",
    marketSourceId: "",
    pricePerKg: "",
    currency: "USD",
    priceBasis: "live_weight",
    recordedAt: today(),
    qualityGrade: "",
    weightMinKg: "",
    weightMaxKg: "",
    notes: "",
  });

  useEffect(() => {
    if (!initialPrice) return;
    setForm({
      speciesId: initialPrice.speciesId ?? "",
      marketSourceId: initialPrice.sourceId ?? "",
      pricePerKg: String(initialPrice.pricePerKg),
      currency: initialPrice.currency,
      priceBasis: initialPrice.priceBasis,
      recordedAt: initialPrice.recordedAt,
      qualityGrade: initialPrice.qualityGrade ?? "",
      weightMinKg: initialPrice.weightMinKg === null ? "" : String(initialPrice.weightMinKg),
      weightMaxKg: initialPrice.weightMaxKg === null ? "" : String(initialPrice.weightMaxKg),
      notes: initialPrice.notes ?? "",
    });
  }, [initialPrice]);

  const setField = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const submit = async () => {
    const pricePerKg = Number(form.pricePerKg);
    const weightMinKg = form.weightMinKg.trim() === "" ? null : Number(form.weightMinKg);
    const weightMaxKg = form.weightMaxKg.trim() === "" ? null : Number(form.weightMaxKg);

    if (!form.speciesId) return toast.error("Species is required");
    if (!form.marketSourceId) return toast.error("Source is required");
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      return toast.error("Price per kg must be greater than 0");
    }
    if (!form.currency.trim()) return toast.error("Currency is required");
    if (!form.recordedAt) return toast.error("Recorded date is required");
    if (
      weightMinKg !== null &&
      weightMaxKg !== null &&
      Number.isFinite(weightMinKg) &&
      Number.isFinite(weightMaxKg) &&
      weightMinKg > weightMaxKg
    ) {
      return toast.error("Minimum weight cannot exceed maximum weight");
    }

    await onSubmit({
      farmId,
      speciesId: form.speciesId,
      marketSourceId: form.marketSourceId,
      pricePerKg,
      currency: form.currency,
      priceBasis: form.priceBasis,
      recordedAt: form.recordedAt,
      qualityGrade: form.qualityGrade || null,
      weightMinKg,
      weightMaxKg,
      notes: form.notes || null,
    });
  };

  return (
    <div className="space-y-3">
      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={form.speciesId}
        onChange={(event) => setField({ speciesId: event.target.value })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          Select species
        </option>
        {species.map((item) => (
          <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
            {item.name}
          </option>
        ))}
      </select>

      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={form.marketSourceId}
        onChange={(event) => setField({ marketSourceId: event.target.value })}
      >
        <option value="" className="bg-farm-900 text-foreground">
          Select source
        </option>
        {sources
          .filter((source) => source.is_active || source.id === form.marketSourceId)
          .map((item) => (
            <option key={item.id} value={item.id} className="bg-farm-900 text-foreground">
              {item.name}
            </option>
          ))}
      </select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Price per kg"
          value={form.pricePerKg}
          onChange={(event) => setField({ pricePerKg: event.target.value })}
        />
        <Input
          placeholder="Currency"
          value={form.currency}
          onChange={(event) => setField({ currency: event.target.value.toUpperCase() })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
          value={form.priceBasis}
          onChange={(event) => setField({ priceBasis: event.target.value as PriceBasis })}
        >
          <option value="live_weight" className="bg-farm-900 text-foreground">
            Live weight
          </option>
          <option value="carcass_weight" className="bg-farm-900 text-foreground">
            Carcass weight
          </option>
          <option value="per_head" className="bg-farm-900 text-foreground">
            Per head
          </option>
        </select>
        <Input
          type="date"
          value={form.recordedAt}
          onChange={(event) => setField({ recordedAt: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          placeholder="Grade"
          value={form.qualityGrade}
          onChange={(event) => setField({ qualityGrade: event.target.value })}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Min kg"
          value={form.weightMinKg}
          onChange={(event) => setField({ weightMinKg: event.target.value })}
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          placeholder="Max kg"
          value={form.weightMaxKg}
          onChange={(event) => setField({ weightMaxKg: event.target.value })}
        />
      </div>

      <Input
        placeholder="Notes"
        value={form.notes}
        onChange={(event) => setField({ notes: event.target.value })}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save Price
        </Button>
      </div>
    </div>
  );
}
