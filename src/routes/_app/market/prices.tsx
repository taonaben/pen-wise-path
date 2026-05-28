import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { useMarketPriceActions, useMarketPriceTrend } from "@/features/market/hooks/useMarketPrices";
import { useMarketSourceActions, useMarketSources } from "@/features/market/hooks/useMarketSources";
import { MarketPriceFilters } from "@/features/market/components/MarketPriceFilters";
import { MarketStatsCards } from "@/features/market/components/MarketStatsCards";
import { MarketPriceChart } from "@/features/market/components/MarketPriceChart";
import { MarketPriceTable } from "@/features/market/components/MarketPriceTable";
import { MarketInsightsPanel } from "@/features/market/components/MarketInsightsPanel";
import { MarketPriceForm } from "@/features/market/components/MarketPriceForm";
import { MarketSourceManager } from "@/features/market/components/MarketSourceManager";
import type {
  MarketPriceFilters as MarketPriceFilterState,
  MarketPricePayload,
  MarketPriceViewModel,
  MarketSourcePayload,
} from "@/features/market/types/market.types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 83);

  return {
    dateFrom: isoDate(start),
    dateTo: isoDate(end),
  };
}

function MarketPricesPage() {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const sourcesQuery = useMarketSources(currentFarm.id);
  const sourceActions = useMarketSourceActions(currentFarm.id);
  const priceActions = useMarketPriceActions(currentFarm.id);

  const [filters, setFilters] = useState<MarketPriceFilterState>({
    ...defaultDateRange(),
    priceBasis: "live_weight",
    currency: "USD",
  });
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<MarketPriceViewModel | null>(null);

  const species = speciesQuery.data ?? [];
  const sources = sourcesQuery.data ?? [];

  useEffect(() => {
    if (filters.speciesId || species.length === 0) return;
    const cattle = species.find((item) => item.slug === "cattle");
    setFilters((current) => ({ ...current, speciesId: cattle?.id ?? species[0]?.id }));
  }, [filters.speciesId, species]);

  const pricesQuery = useMarketPriceTrend(currentFarm.id, filters);
  const rows = pricesQuery.data ?? [];
  const trend = pricesQuery.trend;

  const selectedSpeciesName = useMemo(() => {
    return species.find((item) => item.id === filters.speciesId)?.name ?? "Livestock";
  }, [filters.speciesId, species]);

  const closePriceDialog = () => {
    setPriceDialogOpen(false);
    setEditingPrice(null);
  };

  const onSavePrice = async (payload: MarketPricePayload) => {
    try {
      if (editingPrice) {
        await priceActions.updateMarketPrice.mutateAsync({
          priceId: editingPrice.id,
          payload,
        });
        toast.success("Market price updated");
      } else {
        await priceActions.createMarketPrice.mutateAsync(payload);
        toast.success("Market price recorded");
      }
      closePriceDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save market price");
    }
  };

  const onCreateSource = async (payload: MarketSourcePayload) => {
    try {
      await sourceActions.createMarketSource.mutateAsync(payload);
      toast.success("Market source created");
    } catch {
      toast.error("Could not create market source");
    }
  };

  const onUpdateSource = async (sourceId: string, payload: MarketSourcePayload) => {
    try {
      await sourceActions.updateMarketSource.mutateAsync({ sourceId, payload });
      toast.success("Market source updated");
    } catch {
      toast.error("Could not update market source");
    }
  };

  const onDeactivateSource = async (sourceId: string) => {
    try {
      await sourceActions.deactivateMarketSource.mutateAsync(sourceId);
      toast.success("Market source deactivated");
    } catch {
      toast.error("Could not deactivate market source");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Market Prices"
        description="Track livestock price per kilogram over time and from different sources."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setSourceDialogOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" />
              Manage Sources
            </Button>
            <Button
              type="button"
              className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90"
              onClick={() => {
                setEditingPrice(null);
                setPriceDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Market Price
            </Button>
          </div>
        }
      />

      <MarketPriceFilters
        filters={filters}
        species={species}
        sources={sources}
        onChange={setFilters}
      />

      {pricesQuery.isLoading && (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading market prices...
        </div>
      )}

      {pricesQuery.isError && (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load market prices.
        </div>
      )}

      <MarketStatsCards stats={trend.stats} currency={filters.currency ?? "USD"} />

      <MarketPriceChart
        title={`${selectedSpeciesName} Market Price (${filters.currency ?? "USD"}/kg)`}
        currency={filters.currency ?? "USD"}
        data={trend.trend}
      />

      <MarketPriceTable
        rows={rows}
        onEdit={(row) => {
          setEditingPrice(row);
          setPriceDialogOpen(true);
        }}
        onDelete={async (row) => {
          try {
            await priceActions.deleteMarketPrice.mutateAsync(row.id);
            toast.success("Market price deleted");
          } catch {
            toast.error("Could not delete market price");
          }
        }}
      />

      <MarketInsightsPanel insights={trend.insights} />

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPrice ? "Edit Market Price" : "Add Market Price"}</DialogTitle>
            <DialogDescription>
              Record source-based livestock prices for selling prediction calculations.
            </DialogDescription>
          </DialogHeader>
          <MarketPriceForm
            farmId={currentFarm.id}
            species={species}
            sources={sources}
            initialPrice={editingPrice}
            defaultSpeciesId={filters.speciesId}
            onSubmit={onSavePrice}
            onCancel={closePriceDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Market Sources</DialogTitle>
            <DialogDescription>
              Add buyers, auctions, abattoirs, and other price sources.
            </DialogDescription>
          </DialogHeader>
          <MarketSourceManager
            farmId={currentFarm.id}
            sources={sources}
            onCreate={onCreateSource}
            onUpdate={onUpdateSource}
            onDeactivate={onDeactivateSource}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/_app/market/prices")({
  component: MarketPricesPage,
});
