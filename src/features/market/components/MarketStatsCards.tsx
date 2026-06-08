import { CircleDollarSign, LineChart, Trophy, TrendingUp } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { MarketStats } from "../types/market.types";
import { formatBasis, formatMoney, formatPercent } from "./marketUiFormat";

type Props = {
  stats: MarketStats;
  currency: string;
};

function formatCardMoney(value: number | null | undefined, currency = "USD", suffix = "") {
  const formatted = formatMoney(value, currency, suffix);
  if (formatted === "-") return formatted;
  return currency === "USD" ? formatted.replace("USD ", "$") : formatted;
}

function shortenSourceLabel(value: string | null | undefined) {
  if (!value) return "-";
  const cleaned = value.replace(/^buyer\s*-\s*/i, "").replace(/^auction\s*-\s*/i, "");
  return cleaned.length > 14 ? `${cleaned.slice(0, 14)}...` : cleaned;
}

export function MarketStatsCards({ stats, currency }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
      <StatCard
        title="Latest Price"
        value={
          stats.latestPrice
            ? formatCardMoney(stats.latestPrice.pricePerKg, stats.latestPrice.currency, "/kg")
            : "-"
        }
        description={
          stats.latestPrice
            ? `${formatBasis(stats.latestPrice.priceBasis)} • ${shortenSourceLabel(stats.latestPrice.sourceName)}`
            : "No matching price"
        }
        icon={<CircleDollarSign className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Average Price"
        value={formatCardMoney(stats.averagePrice, currency, "/kg")}
        description="Selected range"
        icon={<LineChart className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Highest Source"
        value={shortenSourceLabel(stats.highestSource)}
        description="Best average offer"
        icon={<Trophy className="h-4 w-4" />}
        variant="success"
        density="compact"
      />
      <StatCard
        title="Lowest Source"
        value={shortenSourceLabel(stats.lowestSource)}
        description="Lowest average offer"
        icon={<CircleDollarSign className="h-4 w-4" />}
        variant="warning"
        density="compact"
      />
      <StatCard
        title="30-Day Change"
        value={formatPercent(stats.priceChangePercent)}
        description="Latest vs earliest"
        icon={<TrendingUp className="h-4 w-4" />}
        variant={(stats.priceChangePercent ?? 0) >= 0 ? "success" : "warning"}
        density="compact"
      />
      <StatCard
        title="Records This Month"
        value={String(stats.recordsThisMonth)}
        description="Market entries"
        icon={<LineChart className="h-4 w-4" />}
        density="compact"
      />
    </div>
  );
}
