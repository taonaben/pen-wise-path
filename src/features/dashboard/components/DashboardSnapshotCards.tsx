import { AlertTriangle, Beef, DollarSign, Target, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { AnimalSummary } from "@/features/animals/types/animal.types";
import type { SellingPredictionViewModel } from "@/features/market/types/sellingPrediction.types";
import type { FeedCostAnalysisResult } from "@/features/feed/types/feedCostAnalysis.types";
import { toCurrency } from "../lib/format";

type Props = {
  activeAnimalsSummary: AnimalSummary | undefined;
  feedCost: FeedCostAnalysisResult | undefined;
  predictions: SellingPredictionViewModel[];
};

export function DashboardSnapshotCards({ activeAnimalsSummary, feedCost, predictions }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Animals"
        value={String(activeAnimalsSummary?.total ?? 0)}
        description="Active in feedlot"
        icon={<Beef className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Average Daily Gain"
        value={`${(feedCost?.summary.averageFcr ?? 0).toFixed(2)} FCR`}
        description="Feed conversion trend"
        variant="success"
        icon={<TrendingUp className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Total Feed Cost"
        value={toCurrency(feedCost?.summary.totalFeedCost ?? 0)}
        description="Last 30 days"
        icon={<Wallet className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Underperforming"
        value={String(activeAnimalsSummary?.underperforming ?? 0)}
        description="Need inspection"
        variant={(activeAnimalsSummary?.underperforming ?? 0) > 0 ? "warning" : "default"}
        icon={<AlertTriangle className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Projected Revenue"
        value={toCurrency(
          predictions.reduce((sum, prediction) => sum + (prediction.expectedRevenue ?? 0), 0),
        )}
        description="From current prediction set"
        variant="success"
        icon={<DollarSign className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Recommended Sales"
        value={String(predictions.filter((item) => item.recommendation === "SELL_NOW").length)}
        description="Within optimal window"
        icon={<Target className="h-4 w-4" />}
        density="compact"
      />
    </div>
  );
}
