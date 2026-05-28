import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { Brain, CircleDollarSign, Eye, Search, TrendingUp, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useSellingPredictions } from "@/features/market/hooks/useSellingPredictions";
import {
  useGenerateSellingPredictions,
  useMarkAnimalSoldFromPrediction,
} from "@/features/market/hooks/useGenerateSellingPredictions";
import type { SellingPredictionViewModel } from "@/features/market/types/sellingPrediction.types";

export const Route = createFileRoute("/_app/market/predictions")({
  component: PredictionsPage,
});

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `$${value.toFixed(2)}`;
}

function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)} kg`;
}

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}${suffix}`;
}

function recommendationLabel(value: SellingPredictionViewModel["recommendation"]) {
  return value.replaceAll("_", " ");
}

function recommendationClass(value: SellingPredictionViewModel["recommendation"]) {
  if (value === "SELL_NOW") return "bg-emerald-500/20 text-emerald-200";
  if (value === "HOLD") return "bg-farm-lime/15 text-farm-lime";
  if (value === "INSPECT_BEFORE_SELLING") return "bg-farm-danger/20 text-farm-danger";
  if (value === "WATCH") return "bg-amber-500/20 text-amber-200";
  return "bg-farm-700 text-farm-muted";
}

function confidenceClass(value: SellingPredictionViewModel["confidenceLabel"]) {
  if (value === "High") return "text-emerald-200";
  if (value === "Medium") return "text-amber-200";
  return "text-farm-danger";
}

function PredictionDetail({ prediction }: { prediction: SellingPredictionViewModel }) {
  const assumptions = prediction.metadata;
  const confidenceReasons = Array.isArray(assumptions.confidence_reasons)
    ? (assumptions.confidence_reasons as string[])
    : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-farm-900/40 p-3">
          <div className="text-xs text-farm-muted">Animal</div>
          <div className="mt-1 font-semibold">{prediction.tagNumber}</div>
        </div>
        <div className="rounded-lg border bg-farm-900/40 p-3">
          <div className="text-xs text-farm-muted">Recommendation</div>
          <div className="mt-1 font-semibold">{recommendationLabel(prediction.recommendation)}</div>
        </div>
        <div className="rounded-lg border bg-farm-900/40 p-3">
          <div className="text-xs text-farm-muted">Confidence</div>
          <div className={`mt-1 font-semibold ${confidenceClass(prediction.confidenceLabel)}`}>
            {prediction.confidenceLabel}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-farm-900/40 p-4">
        <div className="text-sm font-medium">Recommendation Explanation</div>
        <p className="mt-2 text-sm text-farm-muted">{prediction.explanation}</p>
      </div>

      <div className="rounded-xl border bg-farm-900/40 p-4">
        <div className="mb-3 text-sm font-medium">Profit Curve</div>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={prediction.windows} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
              <XAxis dataKey="days" stroke="#9cb8aa" fontSize={11} tickFormatter={(value) => `${value}d`} />
              <YAxis stroke="#9cb8aa" fontSize={11} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                labelFormatter={(value) => `${value} days`}
                contentStyle={{ background: "#062f25", border: "1px solid #16483a", borderRadius: 12 }}
              />
              <Line type="monotone" dataKey="expected_profit" stroke="#b7f34a" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-farm-900/40">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Window</th>
              <th className="px-4 py-3 text-left font-medium">Weight</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Future Feed</th>
              <th className="px-4 py-3 text-left font-medium">Revenue</th>
              <th className="px-4 py-3 text-left font-medium">Profit</th>
              <th className="px-4 py-3 text-left font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {prediction.windows.map((window) => (
              <tr key={window.days} className="border-t border-farm-600/30">
                <td className="px-4 py-3">{window.days === 0 ? "Now" : `${window.days} days`}</td>
                <td className="px-4 py-3">{formatKg(window.predicted_weight)}</td>
                <td className="px-4 py-3">{formatMoney(window.predicted_price)}</td>
                <td className="px-4 py-3">{formatMoney(window.future_feed_cost)}</td>
                <td className="px-4 py-3">{formatMoney(window.expected_revenue)}</td>
                <td className="px-4 py-3">{formatMoney(window.expected_profit)}</td>
                <td className="px-4 py-3">{formatMoney(window.profit_change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-farm-900/40 p-3 text-sm text-farm-muted">
          Market method: {String(assumptions.market_price_method ?? "-")}
        </div>
        <div className="rounded-lg border bg-farm-900/40 p-3 text-sm text-farm-muted">
          Feed cost/day: {formatMoney(Number(assumptions.average_daily_feed_cost ?? 0))}
        </div>
        <div className="rounded-lg border bg-farm-900/40 p-3 text-sm text-farm-muted">
          Risk warnings: {confidenceReasons.length ? confidenceReasons.join(", ") : "None"}
        </div>
      </div>
    </div>
  );
}

function MarkSoldForm({
  prediction,
  farmId,
  onClose,
}: {
  prediction: SellingPredictionViewModel;
  farmId: string;
  onClose: () => void;
}) {
  const markSold = useMarkAnimalSoldFromPrediction(farmId);
  const [saleWeightKg, setSaleWeightKg] = useState(String(prediction.predictedWeightKg ?? prediction.currentWeightKg ?? ""));
  const [pricePerKg, setPricePerKg] = useState(String(prediction.currentMarketPrice ?? ""));
  const [soldAt, setSoldAt] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async () => {
    try {
      await markSold.mutateAsync({
        farmId,
        animalId: prediction.animalId,
        predictionId: prediction.id,
        saleWeightKg: Number(saleWeightKg),
        pricePerKg: Number(pricePerKg),
        soldAt,
        buyerName,
        notes,
      });
      toast.success("Animal marked as sold");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark animal as sold");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input type="number" min={0} step="0.01" value={saleWeightKg} onChange={(event) => setSaleWeightKg(event.target.value)} placeholder="Sale weight kg" />
        <Input type="number" min={0} step="0.01" value={pricePerKg} onChange={(event) => setPricePerKg(event.target.value)} placeholder="Price per kg" />
      </div>
      <Input type="date" value={soldAt} onChange={(event) => setSoldAt(event.target.value)} />
      <Input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Buyer" />
      <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={submit} disabled={markSold.isPending}>
          {markSold.isPending ? "Saving..." : "Mark as Sold"}
        </Button>
      </div>
    </div>
  );
}

function PredictionsPage() {
  const navigate = useNavigate();
  const { currentFarm } = useCurrentFarm();
  const predictionsQuery = useSellingPredictions(currentFarm.id);
  const runPredictions = useGenerateSellingPredictions(currentFarm.id);
  const [detailPrediction, setDetailPrediction] = useState<SellingPredictionViewModel | null>(null);
  const [salePrediction, setSalePrediction] = useState<SellingPredictionViewModel | null>(null);

  const predictions = predictionsQuery.data?.predictions ?? [];
  const summary = useMemo(() => {
    return {
      sellNow: predictions.filter((row) => row.recommendation === "SELL_NOW").length,
      hold: predictions.filter((row) => row.recommendation === "HOLD").length,
      revenue: predictions.reduce((sum, row) => sum + (row.expectedRevenue ?? 0), 0),
      profit: predictions.reduce((sum, row) => sum + (row.expectedProfit ?? 0), 0),
      lowConfidence: predictions.filter((row) => row.confidenceLabel === "Low").length,
      inspect: predictions.filter((row) => row.recommendation === "INSPECT_BEFORE_SELLING").length,
    };
  }, [predictions]);

  const onRunPredictions = async () => {
    try {
      const result = await runPredictions.mutateAsync();
      toast.success(`Prediction run complete: ${result.predictions_created} predictions created`);
    } catch {
      toast.error("Could not run selling predictions");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Selling Predictions"
        description="Estimate the best time to sell animals based on growth, feed cost, and market trends."
        action={
          <Button
            type="button"
            className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90"
            onClick={onRunPredictions}
            disabled={runPredictions.isPending}
          >
            <Brain className="h-4 w-4" />
            {runPredictions.isPending ? "Running..." : "Run Predictions"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Recommended to Sell" value={String(summary.sellNow)} icon={<CircleDollarSign className="h-4 w-4" />} variant="success" />
        <StatCard title="Best Hold Candidates" value={String(summary.hold)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Projected Revenue" value={formatMoney(summary.revenue)} icon={<CircleDollarSign className="h-4 w-4" />} />
        <StatCard title="Projected Profit" value={formatMoney(summary.profit)} icon={<TrendingUp className="h-4 w-4" />} variant={summary.profit >= 0 ? "success" : "danger"} />
        <StatCard title="Low Confidence" value={String(summary.lowConfidence)} icon={<Search className="h-4 w-4" />} variant="warning" />
        <StatCard title="Need Inspection" value={String(summary.inspect)} icon={<TriangleAlert className="h-4 w-4" />} variant="danger" />
      </div>

      {predictionsQuery.data?.latestRun && (
        <div className="rounded-xl border bg-farm-800/80 p-4 text-sm text-farm-muted">
          Latest run: {new Date(predictionsQuery.data.latestRun.startedAt).toLocaleString()} •{" "}
          {predictionsQuery.data.latestRun.status} • {predictionsQuery.data.latestRun.engineVersion}
        </div>
      )}

      {predictionsQuery.isLoading && (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading selling predictions...
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-300 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              {[
                "Animal",
                "Species",
                "Current Weight",
                "ADG",
                "Feed Cost",
                "Market Price",
                "Best Window",
                "Expected Profit",
                "Confidence",
                "Recommendation",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left font-medium">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {predictions.map((row) => (
              <tr key={row.id} className="border-t border-farm-600/30">
                <td className="px-5 py-3 font-medium">{row.tagNumber}</td>
                <td className="px-5 py-3">{row.speciesName}</td>
                <td className="px-5 py-3">{formatKg(row.currentWeightKg)}</td>
                <td className="px-5 py-3">{formatNumber(row.averageDailyGainKg, " kg/day")}</td>
                <td className="px-5 py-3">{formatMoney(Number(row.metadata.feed_cost_to_date ?? 0))}</td>
                <td className="px-5 py-3">{formatMoney(row.currentMarketPrice)}/kg</td>
                <td className="px-5 py-3">{row.bestWindowDays === 0 ? "Now" : `${row.bestWindowDays} days`}</td>
                <td className="px-5 py-3">{formatMoney(row.expectedProfit)}</td>
                <td className={`px-5 py-3 font-medium ${confidenceClass(row.confidenceLabel)}`}>{row.confidenceLabel}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${recommendationClass(row.recommendation)}`}>
                    {recommendationLabel(row.recommendation)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setDetailPrediction(row)}>View</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: "/animals/$id", params: { id: row.animalId } })}
                    >
                      Animal
                    </Button>
                    <Button type="button" size="sm" onClick={() => setSalePrediction(row)}>
                      Mark Sold
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!predictionsQuery.isLoading && predictions.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">
            No stored selling predictions yet. Run predictions to create a snapshot.
          </div>
        )}
      </div>

      <Dialog open={Boolean(detailPrediction)} onOpenChange={(open) => !open && setDetailPrediction(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Animal Prediction Detail</DialogTitle>
            <DialogDescription>
              Stored prediction windows and assumptions from the latest run.
            </DialogDescription>
          </DialogHeader>
          {detailPrediction && <PredictionDetail prediction={detailPrediction} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(salePrediction)} onOpenChange={(open) => !open && setSalePrediction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Animal as Sold</DialogTitle>
            <DialogDescription>Create a sale record and update the animal status.</DialogDescription>
          </DialogHeader>
          {salePrediction && (
            <MarkSoldForm
              farmId={currentFarm.id}
              prediction={salePrediction}
              onClose={() => setSalePrediction(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
