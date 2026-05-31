import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salesRecordService } from "../services/salesRecordService";
import type { SalesRecordViewModel } from "../types/sales.types";
import {
  formatCurrency,
  formatKg,
  formatPaymentStatus,
  formatPercent,
  formatPredictionAccuracy,
} from "./salesUiFormat";

type Props = {
  farmId: string;
  sale: SalesRecordViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-farm-muted">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function SaleDetailDialog({ farmId, sale, open, onOpenChange }: Props) {
  const auditQuery = useQuery({
    queryKey: ["sales-records", farmId, "audit", sale?.id ?? "none"],
    queryFn: () => salesRecordService.getSaleAuditTrail(farmId, sale!.id),
    enabled: Boolean(open && sale?.id),
  });

  if (!sale) return null;

  const predictionComparison = sale.metadata.prediction_comparison as
    | Record<string, unknown>
    | undefined;
  const marketComparison = sale.metadata.market_comparison as Record<string, unknown> | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] w-[calc(100vw-0.75rem)] max-w-4xl overflow-y-auto p-4 sm:h-auto sm:max-h-[90vh] sm:w-full sm:p-6">
        <DialogHeader>
          <DialogTitle>Sale Detail - {sale.tagNumber}</DialogTitle>
          <DialogDescription>
            Revenue, cost, prediction, market comparison, and audit context.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <section className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
            <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">Sale Summary</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              <DetailItem label="Animal" value={sale.tagNumber} />
              <DetailItem label="Buyer" value={sale.buyerName} />
              <DetailItem label="Sale Date" value={sale.soldAt} />
              <DetailItem label="Payment" value={formatPaymentStatus(sale.paymentStatus)} />
              <DetailItem label="Sale Weight" value={formatKg(sale.saleWeightKg)} />
              <DetailItem
                label="Price"
                value={`${formatCurrency(sale.pricePerKg, sale.currency)}/kg`}
              />
              <DetailItem
                label="Gross Amount"
                value={formatCurrency(sale.grossAmount, sale.currency)}
              />
              <DetailItem
                label="Profit Margin"
                value={formatPercent(sale.profitMarginPercentage)}
              />
            </div>
          </section>

          <section className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
            <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">
              Animal Cost Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
              <DetailItem
                label="Purchase Cost"
                value={formatCurrency(sale.purchaseCost, sale.currency)}
              />
              <DetailItem label="Feed Cost" value={formatCurrency(sale.feedCost, sale.currency)} />
              <DetailItem
                label="Health Cost"
                value={formatCurrency(sale.healthCost, sale.currency)}
              />
              <DetailItem
                label="Other Cost"
                value={formatCurrency(sale.otherCost, sale.currency)}
              />
              <DetailItem
                label="Total Cost"
                value={formatCurrency(sale.totalCost, sale.currency)}
              />
              <DetailItem
                label="Net Profit"
                value={formatCurrency(sale.netProfit, sale.currency)}
              />
            </div>
          </section>

          <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">
                Prediction Comparison
              </h3>
              <div className="space-y-1.5 text-sm sm:space-y-2">
                <DetailItem
                  label="Result"
                  value={formatPredictionAccuracy(sale.predictionAccuracy)}
                />
                <DetailItem
                  label="Predicted Date"
                  value={String(predictionComparison?.predicted_sell_date ?? "-")}
                />
                <DetailItem
                  label="Predicted Weight"
                  value={
                    predictionComparison?.predicted_weight_kg
                      ? formatKg(Number(predictionComparison.predicted_weight_kg))
                      : "-"
                  }
                />
                <DetailItem
                  label="Predicted Profit"
                  value={
                    predictionComparison?.predicted_profit
                      ? formatCurrency(Number(predictionComparison.predicted_profit), sale.currency)
                      : "-"
                  }
                />
              </div>
            </div>

            <div className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">
                Market Price Comparison
              </h3>
              <div className="space-y-1.5 text-sm sm:space-y-2">
                <DetailItem
                  label="Actual Price"
                  value={`${formatCurrency(sale.pricePerKg, sale.currency)}/kg`}
                />
                <DetailItem
                  label="Market Price"
                  value={
                    marketComparison?.market_price_per_kg
                      ? `${formatCurrency(Number(marketComparison.market_price_per_kg), sale.currency)}/kg`
                      : "-"
                  }
                />
                <DetailItem
                  label="Difference"
                  value={
                    sale.marketComparisonPercentage === null
                      ? "-"
                      : `${sale.marketComparisonPercentage.toFixed(1)}%`
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-farm-900/40 p-3 sm:p-4">
            <h3 className="mb-2 text-sm font-semibold sm:mb-3 sm:text-base">Audit Trail</h3>
            <div className="space-y-2 text-sm">
              {(auditQuery.data ?? []).length === 0 && (
                <div className="text-farm-muted">No audit entries found for this sale.</div>
              )}
              {(auditQuery.data ?? []).map((log) => (
                <div key={log.id} className="rounded-lg bg-farm-800/60 p-3">
                  <div className="font-medium">{log.description}</div>
                  <div className="text-xs text-farm-muted">
                    {log.actorName} - {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
