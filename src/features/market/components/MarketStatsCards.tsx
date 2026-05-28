import { CircleDollarSign, LineChart, Trophy, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { MarketStats } from "../types/market.types";
import { formatBasis, formatMoney, formatPercent } from "./marketUiFormat";

type Props = {
  stats: MarketStats;
  currency: string;
};

export function MarketStatsCards({ stats, currency }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="Latest Price"
        value={stats.latestPrice ? formatMoney(stats.latestPrice.pricePerKg, stats.latestPrice.currency, "/kg") : "-"}
        description={
          stats.latestPrice
            ? `${formatBasis(stats.latestPrice.priceBasis)} • ${stats.latestPrice.sourceName}`
            : "No matching price"
        }
        icon={<CircleDollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Average Price"
        value={formatMoney(stats.averagePrice, currency, "/kg")}
        description="Selected range"
        icon={<LineChart className="h-4 w-4" />}
      />
      <StatCard
        title="Highest Source"
        value={stats.highestSource ?? "-"}
        description="Best average offer"
        icon={<Trophy className="h-4 w-4" />}
        variant="success"
      />
      <StatCard
        title="Lowest Source"
        value={stats.lowestSource ?? "-"}
        description="Lowest average offer"
        icon={<CircleDollarSign className="h-4 w-4" />}
        variant="warning"
      />
      <StatCard
        title="30-Day Change"
        value={formatPercent(stats.priceChangePercent)}
        description="Latest vs earliest"
        icon={<TrendingUp className="h-4 w-4" />}
        variant={(stats.priceChangePercent ?? 0) >= 0 ? "success" : "warning"}
      />
      <StatCard
        title="Records This Month"
        value={String(stats.recordsThisMonth)}
        description="Market entries"
        icon={<LineChart className="h-4 w-4" />}
      />
    </div>
  );
}
