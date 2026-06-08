import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AnimalSpecies } from "@/features/animals/types/animal.types";
import type {
  MarketPricePayload,
  MarketPriceViewModel,
  MarketSource,
  MarketSourcePayload,
  PriceBasis,
} from "../types/market.types";
import { MarketSourceManager } from "./MarketSourceManager";

type Props = {
  farmId: string;
  species: AnimalSpecies[];
  sources: MarketSource[];
  initialPrice?: MarketPriceViewModel | null;
  defaultSpeciesId?: string;
  onSubmit: (payload: MarketPricePayload) => Promise<void>;
  onCancel: () => void;
  onCreateSource?: (payload: MarketSourcePayload) => Promise<MarketSource | void>;
  onUpdateSource?: (sourceId: string, payload: MarketSourcePayload) => Promise<void>;
  onDeactivateSource?: (sourceId: string) => Promise<void>;
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

function createDefaultForm(defaultSpeciesId?: string): FormState {
  return {
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
  };
}

function shouldOpenMoreDetails(price?: MarketPriceViewModel | null) {
  if (!price) return false;

  return Boolean(
    price.qualityGrade?.trim() ||
    price.notes?.trim() ||
    price.weightMinKg !== null ||
    price.weightMaxKg !== null,
  );
}

const ADD_SOURCE_VALUE = "__add_source__";

export function MarketPriceForm({
  farmId,
  species,
  sources,
  initialPrice,
  defaultSpeciesId,
  onSubmit,
  onCancel,
  onCreateSource,
  onUpdateSource,
  onDeactivateSource,
}: Props) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [sourceManagerOpen, setSourceManagerOpen] = useState(false);
  const [localSources, setLocalSources] = useState<MarketSource[]>([]);
  const [form, setForm] = useState<FormState>(() => createDefaultForm(defaultSpeciesId));

  const availableSources = [...localSources, ...sources].filter(
    (source, index, list) => list.findIndex((item) => item.id === source.id) === index,
  );

  useEffect(() => {
    if (!initialPrice) {
      setForm(createDefaultForm(defaultSpeciesId));
      setShowMoreDetails(false);
      return;
    }

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
    setShowMoreDetails(shouldOpenMoreDetails(initialPrice));
  }, [defaultSpeciesId, initialPrice]);

  const setField = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const handleSourceChange = (value: string) => {
    if (value === ADD_SOURCE_VALUE) {
      setSourceManagerOpen(true);
      return;
    }
    setField({ marketSourceId: value });
  };

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
      <div className="rounded-xl border border-farm-600/30 bg-farm-900/35 p-3 text-xs text-farm-muted">
        Enter the core market price details first. Optional metadata can be added under More details
        to improve filtering and comparison.
      </div>

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

      <Select value={form.marketSourceId || undefined} onValueChange={handleSourceChange}>
        <SelectTrigger className="h-9 w-full bg-farm-900 text-sm text-foreground">
          <SelectValue placeholder="Select source" />
        </SelectTrigger>
        <SelectContent>
          {availableSources
            .filter((source) => source.is_active || source.id === form.marketSourceId)
            .map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          {onCreateSource && onUpdateSource && onDeactivateSource && (
            <SelectItem value={ADD_SOURCE_VALUE}>
              <span className="inline-flex items-center gap-2 font-medium text-farm-lime">
                <Plus className="h-4 w-4" />
                Add source...
              </span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

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
        <Input
          type="date"
          value={form.recordedAt}
          onChange={(event) => setField({ recordedAt: event.target.value })}
        />
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
      </div>

      <Accordion type="single" collapsible value={showMoreDetails ? "details" : undefined}>
        <AccordionItem
          value="details"
          className="rounded-xl border border-farm-600/30 bg-farm-900/25 px-4"
        >
          <AccordionTrigger
            className="py-3 text-sm font-medium hover:no-underline"
            onClick={() => setShowMoreDetails((current) => !current)}
          >
            More details
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="space-y-3">
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save Price
        </Button>
      </div>

      {onCreateSource && onUpdateSource && onDeactivateSource && (
        <Dialog open={sourceManagerOpen} onOpenChange={setSourceManagerOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Market Sources</DialogTitle>
              <DialogDescription>
                Add or update buyer, auction, and abattoir sources without leaving this form.
              </DialogDescription>
            </DialogHeader>
            <MarketSourceManager
              farmId={farmId}
              sources={sources}
              onCreate={async (payload) => {
                const created = await onCreateSource(payload);
                if (created?.id) {
                  setLocalSources((current) => [created, ...current]);
                  setField({ marketSourceId: created.id });
                  setSourceManagerOpen(false);
                }
                return created;
              }}
              onUpdate={onUpdateSource}
              onDeactivate={onDeactivateSource}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
