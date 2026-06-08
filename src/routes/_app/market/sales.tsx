import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Download, Plus, SlidersHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { useAnimals } from "@/features/animals/hooks/useAnimals";
import { SaleDetailDialog } from "@/features/market/components/SaleDetailDialog";
import { SaleRecordForm } from "@/features/market/components/SaleRecordForm";
import { SalesFilters } from "@/features/market/components/SalesFilters";
import { SalesStatsCards } from "@/features/market/components/SalesStatsCards";
import { SalesTable } from "@/features/market/components/SalesTable";
import { formatCurrency } from "@/features/market/components/salesUiFormat";
import { useSalesAnalytics, useSalesRecordActions } from "@/features/market/hooks/useSalesRecords";
import type {
  SalesFilters as SalesFilterState,
  SalesRecordPayload,
  SalesRecordViewModel,
} from "@/features/market/types/sales.types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function defaultFilters(): SalesFilterState {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    dateFrom: isoDate(start),
    dateTo: isoDate(end),
    saleStatus: "all",
    paymentStatus: "all",
    profitStatus: "all",
  };
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv(rows: SalesRecordViewModel[]) {
  const headers = [
    "Sale Date",
    "Animal",
    "Species",
    "Buyer",
    "Sale Weight",
    "Price Per Kg",
    "Gross Amount",
    "Total Cost",
    "Net Profit",
    "Margin",
    "Prediction Result",
    "Sale Status",
  ];
  const lines = rows.map((row) =>
    [
      row.soldAt,
      row.tagNumber,
      row.speciesName,
      row.buyerName,
      row.saleWeightKg,
      row.pricePerKg,
      row.grossAmount,
      row.totalCost,
      row.netProfit,
      row.profitMarginPercentage ?? "",
      row.predictionAccuracy,
      row.saleStatus,
    ]
      .map(csvEscape)
      .join(","),
  );
  const blob = new Blob([[headers.map(csvEscape).join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `sales-records-${isoDate(new Date())}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SalesRecordsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const activeAnimalsQuery = useAnimals(currentFarm.id, { status: "active" });
  const [filters, setFilters] = useState<SalesFilterState>(defaultFilters);
  const salesQuery = useSalesAnalytics(currentFarm.id, filters);
  const actions = useSalesRecordActions(currentFarm.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesRecordViewModel | null>(null);
  const [detailSale, setDetailSale] = useState<SalesRecordViewModel | null>(null);
  const [voidSale, setVoidSale] = useState<SalesRecordViewModel | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const rows = salesQuery.data ?? [];
  const analytics = salesQuery.analytics;
  const activeAnimals = activeAnimalsQuery.data?.animals ?? [];
  const species = speciesQuery.data ?? [];

  const chartData = useMemo(
    () =>
      analytics.trend.map((item) => ({
        week: item.week.slice(5),
        Revenue: item.revenue,
        Profit: item.profit,
      })),
    [analytics.trend],
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditingSale(null);
  };

  const saveSale = async (payload: SalesRecordPayload) => {
    try {
      if (editingSale) {
        await actions.updateSale.mutateAsync({ saleId: editingSale.id, payload });
        toast.success("Sale updated");
      } else {
        await actions.createSale.mutateAsync(payload);
        toast.success("Sale recorded");
      }
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save sale");
    }
  };

  const confirmVoid = async () => {
    if (!voidSale) return;
    try {
      await actions.voidSale.mutateAsync({ saleId: voidSale.id, reason: voidReason });
      toast.success("Sale voided");
      setVoidSale(null);
      setVoidReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not void sale");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales Records"
        description="Record sold animals, revenue, and profit outcomes."
        action={
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => exportCsv(rows)}
              className="w-full"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button
              type="button"
              className="w-full bg-farm-lime text-farm-950 hover:bg-farm-lime/90"
              onClick={() => {
                setEditingSale(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Record Sale
            </Button>
          </div>
        }
      />

      {isMobile && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 border-farm-600/50 bg-farm-800/70 text-foreground hover:bg-farm-700/60"
          onClick={() => setShowMobileFilters((current) => !current)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      )}

      {(!isMobile || showMobileFilters) && (
        <SalesFilters filters={filters} species={species} onChange={setFilters} />
      )}

      {salesQuery.isError && (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load sales records.
        </div>
      )}

      <SalesStatsCards summary={analytics.summary} />

      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border bg-farm-800/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Revenue and Profit Over Time</h2>
              <p className="text-sm text-farm-muted">
                Weekly sales outcomes from filtered records.
              </p>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: "#142018",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <Legend />
                <Bar dataKey="Revenue" fill="#a3e635" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-farm-800/70 p-4 sm:p-5">
          <h2 className="font-semibold">Buyer Performance</h2>
          <p className="text-sm text-farm-muted">Best buyers by revenue and price.</p>
          <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
            {analytics.buyerPerformance.slice(0, 5).map((buyer) => (
              <div key={buyer.buyerName} className="rounded-xl bg-farm-900/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{buyer.buyerName}</div>
                  <div className="text-sm text-farm-lime">{formatCurrency(buyer.totalRevenue)}</div>
                </div>
                <div className="mt-1 text-xs text-farm-muted">
                  {buyer.animalsBought} animals - {formatCurrency(buyer.averagePricePerKg)}/kg avg
                </div>
              </div>
            ))}
            {analytics.buyerPerformance.length === 0 && (
              <div className="text-sm text-farm-muted">No buyer performance yet.</div>
            )}
          </div>
        </div>
      </div>

      {salesQuery.isLoading ? (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading sales records...
        </div>
      ) : (
        <SalesTable
          rows={rows}
          onView={setDetailSale}
          onEdit={(row) => {
            setEditingSale(row);
            setFormOpen(true);
          }}
          onVoid={setVoidSale}
          onViewAnimal={(animalId) => navigate({ to: "/animals/$id", params: { id: animalId } })}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="h-[92vh] w-[calc(100vw-0.75rem)] max-w-4xl overflow-y-auto p-4 sm:h-auto sm:max-h-[90vh] sm:w-full sm:p-6">
          <DialogHeader>
            <DialogTitle>{editingSale ? "Edit Sale" : "Record Sale"}</DialogTitle>
            <DialogDescription>
              Save the actual sale outcome and update the animal automatically.
            </DialogDescription>
          </DialogHeader>
          <SaleRecordForm
            farmId={currentFarm.id}
            animals={activeAnimals}
            initialSale={editingSale}
            onSubmit={saveSale}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      <SaleDetailDialog
        farmId={currentFarm.id}
        sale={detailSale}
        open={Boolean(detailSale)}
        onOpenChange={(open) => {
          if (!open) setDetailSale(null);
        }}
      />

      <Dialog open={Boolean(voidSale)} onOpenChange={(open) => !open && setVoidSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Sale</DialogTitle>
            <DialogDescription>
              Voiding keeps the financial record but removes it from completed sale analytics.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for voiding"
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVoidSale(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmVoid}>
              Void Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createFileRoute("/_app/market/sales")({
  component: SalesRecordsPage,
});
