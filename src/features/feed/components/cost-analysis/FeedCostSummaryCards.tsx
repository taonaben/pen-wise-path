import { AlertTriangle, CircleDollarSign, Scale, TrendingUp, Wheat } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { FeedCostAnalysisSummary } from "../../types/feedCostAnalysis.types";
import { formatKg, formatMoney, formatRatio } from "./format";

type Props = {
  summary: FeedCostAnalysisSummary;
};

export function FeedCostSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="Total Feed Cost"
        value={formatMoney(summary.totalFeedCost)}
        description="Selected period"
        icon={<CircleDollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Total Feed Used"
        value={formatKg(summary.totalFeedUsedKg)}
        description="Allocated to animals"
        icon={<Scale className="h-4 w-4" />}
      />
      <StatCard
        title="Avg Cost / Kg Gained"
        value={formatMoney(summary.averageCostPerKgGained, "/kg")}
        description="Animals with usable weights"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Average FCR"
        value={formatRatio(summary.averageFcr)}
        description="Feed kg per kg gained"
        icon={<Wheat className="h-4 w-4" />}
      />
      <StatCard
        title="Most Expensive Feed"
        value={summary.mostExpensiveFeed ?? "-"}
        description="Largest cost driver"
        icon={<Wheat className="h-4 w-4" />}
      />
      <StatCard
        title="Worst Performing Pen"
        value={summary.worstPerformingPen ?? "-"}
        description="By cost of gain"
        icon={<AlertTriangle className="h-4 w-4" />}
        variant={summary.worstPerformingPen ? "warning" : "default"}
      />
    </div>
  );
}
