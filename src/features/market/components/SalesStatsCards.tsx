import { BadgeDollarSign, Scale, TrendingDown, Trophy, Users, Wallet } from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { SalesSummary } from "../types/sales.types";
import { formatCurrency } from "./salesUiFormat";

type Props = {
  summary: SalesSummary;
  currency?: string;
};

export function SalesStatsCards({ summary, currency = "USD" }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard
        title="Total Sales Revenue"
        value={formatCurrency(summary.totalRevenue, currency)}
        description="Filtered period"
        icon={<BadgeDollarSign className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Animals Sold"
        value={String(summary.animalsSold)}
        description="Completed and pending"
        icon={<Users className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Average Price / Kg"
        value={
          summary.averagePricePerKg === null
            ? "-"
            : formatCurrency(summary.averagePricePerKg, currency)
        }
        description="Live weight equivalent"
        icon={<Scale className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Average Profit / Animal"
        value={
          summary.averageProfitPerAnimal === null
            ? "-"
            : formatCurrency(summary.averageProfitPerAnimal, currency)
        }
        description="Net after recorded costs"
        icon={<Wallet className="h-4 w-4" />}
        density="compact"
      />
      <StatCard
        title="Best Sale"
        value={
          summary.bestSale
            ? formatCurrency(summary.bestSale.netProfit, summary.bestSale.currency)
            : "-"
        }
        description={summary.bestSale?.tagNumber ?? "No sales yet"}
        icon={<Trophy className="h-4 w-4" />}
        variant="success"
        density="compact"
      />
      <StatCard
        title="Loss-Making Sales"
        value={String(summary.lossMakingSales)}
        description="Need review"
        icon={<TrendingDown className="h-4 w-4" />}
        variant={summary.lossMakingSales > 0 ? "danger" : "default"}
        density="compact"
      />
    </div>
  );
}
