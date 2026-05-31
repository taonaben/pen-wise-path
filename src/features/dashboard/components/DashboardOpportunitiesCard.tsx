import type { SellingPredictionViewModel } from "@/features/market/types/sellingPrediction.types";
import { toCurrency, toShortDate } from "../lib/format";

type Props = {
  opportunities: SellingPredictionViewModel[];
  onNavigateToPredictions: () => void;
};

export function DashboardOpportunitiesCard({ opportunities, onNavigateToPredictions }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-4 backdrop-blur-sm sm:p-5 xl:col-span-2">
      <div className="mb-3 text-sm font-medium">Upcoming Opportunities</div>
      <div className="space-y-2">
        {opportunities.length === 0 ? (
          <p className="text-sm text-farm-muted">No immediate selling opportunities detected.</p>
        ) : (
          opportunities.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={onNavigateToPredictions}
              className="w-full rounded-lg border border-farm-600/40 bg-farm-900/40 px-3 py-2 text-left transition hover:bg-farm-900"
            >
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div>
                  <div className="text-sm font-medium">
                    {item.tagNumber} · {item.speciesName}
                  </div>
                  <div className="text-xs text-farm-muted">
                    Best sell date: {toShortDate(item.bestSellDate)} · Confidence{" "}
                    {item.confidenceLabel}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-medium text-farm-lime">
                    {toCurrency(item.expectedProfit ?? 0)}
                  </div>
                  <div className="text-xs text-farm-muted">expected profit</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
