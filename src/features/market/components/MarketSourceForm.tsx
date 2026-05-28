import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MarketSource, MarketSourcePayload, MarketSourceType } from "../types/market.types";

type Props = {
  farmId: string;
  initialSource?: MarketSource | null;
  onSubmit: (payload: MarketSourcePayload) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  name: string;
  sourceType: MarketSourceType;
  location: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  isActive: boolean;
};

const sourceTypes: MarketSourceType[] = [
  "auction",
  "abattoir",
  "butcher",
  "private_buyer",
  "market_board",
  "online",
  "other",
];

export function MarketSourceForm({ farmId, initialSource, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>({
    name: "",
    sourceType: "other",
    location: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    isActive: true,
  });

  useEffect(() => {
    if (!initialSource) return;
    setForm({
      name: initialSource.name,
      sourceType: initialSource.source_type,
      location: initialSource.location ?? "",
      contactName: initialSource.contact_name ?? "",
      contactPhone: initialSource.contact_phone ?? "",
      notes: initialSource.notes ?? "",
      isActive: initialSource.is_active,
    });
  }, [initialSource]);

  const setField = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.sourceType) return toast.error("Source type is required");

    await onSubmit({
      farmId,
      name: form.name,
      sourceType: form.sourceType,
      location: form.location || null,
      contactName: form.contactName || null,
      contactPhone: form.contactPhone || null,
      notes: form.notes || null,
      isActive: form.isActive,
    });
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Source name"
        value={form.name}
        onChange={(event) => setField({ name: event.target.value })}
      />
      <select
        className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 text-sm text-foreground"
        value={form.sourceType}
        onChange={(event) => setField({ sourceType: event.target.value as MarketSourceType })}
      >
        {sourceTypes.map((type) => (
          <option key={type} value={type} className="bg-farm-900 text-foreground">
            {type.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <Input
        placeholder="Location"
        value={form.location}
        onChange={(event) => setField({ location: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="Contact person"
          value={form.contactName}
          onChange={(event) => setField({ contactName: event.target.value })}
        />
        <Input
          placeholder="Phone"
          value={form.contactPhone}
          onChange={(event) => setField({ contactPhone: event.target.value })}
        />
      </div>
      <Input
        placeholder="Notes"
        value={form.notes}
        onChange={(event) => setField({ notes: event.target.value })}
      />
      <label className="flex items-center gap-2 text-sm text-farm-muted">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => setField({ isActive: event.target.checked })}
        />
        Active source
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={submit}>
          Save Source
        </Button>
      </div>
    </div>
  );
}
