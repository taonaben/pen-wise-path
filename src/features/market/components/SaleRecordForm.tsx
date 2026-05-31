import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaleDraftContext } from "../hooks/useSalesRecords";
import type { AnimalViewModel } from "@/features/animals/types/animal.types";
import type { SalesRecordPayload, SalesRecordViewModel } from "../types/sales.types";
import { formatCurrency, formatKg } from "./salesUiFormat";

type Props = {
  farmId: string;
  animals: AnimalViewModel[];
  initialSale?: SalesRecordViewModel | null;
  onSubmit: (payload: SalesRecordPayload) => Promise<void>;
  onCancel: () => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SaleRecordForm({ farmId, animals, initialSale, onSubmit, onCancel }: Props) {
  const [animalId, setAnimalId] = useState(initialSale?.animalId ?? animals[0]?.id ?? "");
  const [buyerName, setBuyerName] = useState(initialSale?.buyerName ?? "");
  const [buyerContact, setBuyerContact] = useState(initialSale?.buyerContact ?? "");
  const [soldAt, setSoldAt] = useState(initialSale?.soldAt ?? today());
  const [saleWeightKg, setSaleWeightKg] = useState(String(initialSale?.saleWeightKg ?? ""));
  const [pricePerKg, setPricePerKg] = useState(String(initialSale?.pricePerKg ?? ""));
  const [priceBasis, setPriceBasis] = useState<SalesRecordPayload["priceBasis"]>(
    initialSale?.priceBasis ?? "live_weight",
  );
  const [grossAmount, setGrossAmount] = useState(String(initialSale?.grossAmount ?? ""));
  const [currency, setCurrency] = useState(initialSale?.currency ?? "USD");
  const [healthCost, setHealthCost] = useState(String(initialSale?.healthCost ?? 0));
  const [otherCost, setOtherCost] = useState(String(initialSale?.otherCost ?? 0));
  const [paymentStatus, setPaymentStatus] = useState<SalesRecordPayload["paymentStatus"]>(
    initialSale?.paymentStatus ?? "paid",
  );
  const [notes, setNotes] = useState(initialSale?.notes ?? "");
  const [createMarketPrice, setCreateMarketPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const draftQuery = useSaleDraftContext(farmId, animalId || undefined);
  const selectedAnimal =
    draftQuery.data?.animal ?? animals.find((animal) => animal.id === animalId);

  useEffect(() => {
    if (initialSale || !draftQuery.data) return;
    if (!saleWeightKg && draftQuery.data.animal.currentWeightKg) {
      setSaleWeightKg(String(draftQuery.data.animal.currentWeightKg));
    }
    if (!pricePerKg && draftQuery.data.latestMarketPrice) {
      setPricePerKg(String(draftQuery.data.latestMarketPrice));
    }
  }, [draftQuery.data, initialSale, pricePerKg, saleWeightKg]);

  const preview = useMemo(() => {
    const weight = Number(saleWeightKg) || 0;
    const price = Number(pricePerKg) || 0;
    const enteredGross = Number(grossAmount) || 0;
    const gross = priceBasis === "per_head" ? enteredGross : weight * price;
    const purchaseCost = initialSale?.purchaseCost ?? selectedAnimal?.purchasePrice ?? 0;
    const feedCost = initialSale?.feedCost ?? draftQuery.data?.feedCost ?? 0;
    const health = Number(healthCost) || 0;
    const other = Number(otherCost) || 0;
    const totalCost = purchaseCost + feedCost + health + other;
    const profit = gross - totalCost;
    const margin = gross > 0 ? (profit / gross) * 100 : null;
    const market = draftQuery.data?.latestMarketPrice ?? null;
    const marketComparison = market && market > 0 ? ((price - market) / market) * 100 : null;

    return { gross, purchaseCost, feedCost, totalCost, profit, margin, marketComparison };
  }, [
    draftQuery.data,
    grossAmount,
    healthCost,
    initialSale,
    otherCost,
    priceBasis,
    pricePerKg,
    saleWeightKg,
    selectedAnimal,
  ]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        farmId,
        animalId,
        buyerName,
        buyerContact,
        soldAt,
        saleWeightKg: Number(saleWeightKg),
        pricePerKg: Number(pricePerKg),
        priceBasis,
        currency,
        grossAmount: priceBasis === "per_head" ? Number(grossAmount) : null,
        healthCost: Number(healthCost) || 0,
        otherCost: Number(otherCost) || 0,
        paymentStatus,
        notes,
        createMarketPrice,
        marketPriceId: draftQuery.data?.latestMarketPriceId ?? null,
        predictionId: draftQuery.data?.latestPrediction?.id ?? initialSale?.predictionId ?? null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-0">
      <div className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
        <div className="mb-3 text-sm font-medium">Sale Details</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-farm-muted">Animal</label>
            <Select value={animalId} onValueChange={setAnimalId} disabled={Boolean(initialSale)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select animal" />
              </SelectTrigger>
              <SelectContent>
                {initialSale && (
                  <SelectItem value={initialSale.animalId}>{initialSale.tagNumber}</SelectItem>
                )}
                {animals.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>
                    {animal.tagNumber} - {animal.speciesLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Sale Date</label>
            <Input
              className="h-11"
              type="date"
              value={soldAt}
              onChange={(event) => setSoldAt(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Sale Weight</label>
            <Input
              className="h-11"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={saleWeightKg}
              onChange={(event) => setSaleWeightKg(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Price Per Kg</label>
            <Input
              className="h-11"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={pricePerKg}
              onChange={(event) => setPricePerKg(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Price Basis</label>
            <Select
              value={priceBasis}
              onValueChange={(value) => setPriceBasis(value as SalesRecordPayload["priceBasis"])}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live_weight">Live weight</SelectItem>
                <SelectItem value="carcass_weight">Carcass weight</SelectItem>
                <SelectItem value="per_head">Per head</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Currency</label>
            <Input
              className="h-11"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            />
          </div>
          {priceBasis === "per_head" && (
            <div>
              <label className="text-xs font-medium text-farm-muted">Gross Amount</label>
              <Input
                className="h-11"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={grossAmount}
                onChange={(event) => setGrossAmount(event.target.value)}
              />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-farm-muted">Payment Status</label>
            <Select
              value={paymentStatus}
              onValueChange={(value) =>
                setPaymentStatus(value as SalesRecordPayload["paymentStatus"])
              }
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
        <div className="mb-3 text-sm font-medium">Buyer (Optional)</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-farm-muted">Buyer Name</label>
            <Input
              className="h-11"
              value={buyerName}
              placeholder="e.g. Green Valley Traders"
              onChange={(event) => setBuyerName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Buyer Contact</label>
            <Input
              className="h-11"
              value={buyerContact}
              placeholder="Phone or reference"
              onChange={(event) => setBuyerContact(event.target.value)}
            />
          </div>
        </div>
      </div>

      <details className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
        <summary className="cursor-pointer text-sm font-medium">Optional Costs & Notes</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-farm-muted">Health Cost</label>
            <Input
              className="h-11"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={healthCost}
              onChange={(event) => setHealthCost(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-farm-muted">Other Cost</label>
            <Input
              className="h-11"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={otherCost}
              onChange={(event) => setOtherCost(event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-farm-muted">Notes</label>
            <Textarea
              value={notes}
              rows={3}
              placeholder="Any extra context about this sale"
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </details>

      <div className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Current/latest weight</span>
            <div>{formatKg(selectedAnimal?.currentWeightKg ?? null)}</div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Purchase cost</span>
            <div>{formatCurrency(preview.purchaseCost, currency)}</div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Feed cost</span>
            <div>{formatCurrency(preview.feedCost, currency)}</div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Latest market</span>
            <div>
              {draftQuery.data?.latestMarketPrice
                ? `${formatCurrency(draftQuery.data.latestMarketPrice, currency)}/kg`
                : "-"}
            </div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Gross amount</span>
            <div>{formatCurrency(preview.gross, currency)}</div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Total cost</span>
            <div>{formatCurrency(preview.totalCost, currency)}</div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Estimated profit</span>
            <div className={preview.profit < 0 ? "text-farm-danger" : "text-farm-success"}>
              {formatCurrency(preview.profit, currency)}
            </div>
          </div>
          <div className="rounded-md border border-farm-600/40 bg-farm-950/50 p-2">
            <span className="text-farm-muted">Market comparison</span>
            <div>
              {preview.marketComparison === null ? "-" : `${preview.marketComparison.toFixed(1)}%`}
            </div>
          </div>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <Checkbox
            checked={createMarketPrice}
            onCheckedChange={(checked) => setCreateMarketPrice(Boolean(checked))}
          />
          <span>Use this sale as a verified market price record</span>
        </label>
      </div>

      <div className="sticky bottom-0 z-20 rounded-xl border border-farm-600/40 bg-farm-900/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || !animalId}
            className="w-full sm:w-auto"
          >
            {submitting ? "Saving..." : initialSale ? "Update Sale" : "Record Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
}
