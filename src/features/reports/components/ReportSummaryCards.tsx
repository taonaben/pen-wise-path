import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Scale,
  Target,
  TrendingUp,
  Wallet,
  Weight,
} from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import type { ReportSummaryItem } from "../types/report.types";

type Props = {
  items: ReportSummaryItem[];
};

export function ReportSummaryCards({ items }: Props) {
  const iconById: Record<string, JSX.Element> = {
    "active-animals": <Activity className="h-4 w-4" />,
    "avg-adg": <TrendingUp className="h-4 w-4" />,
    "avg-weight": <Weight className="h-4 w-4" />,
    "total-gain": <Scale className="h-4 w-4" />,
    underperforming: <AlertTriangle className="h-4 w-4" />,
    "ready-for-sale": <Target className="h-4 w-4" />,
    revenue: <BadgeDollarSign className="h-4 w-4" />,
    profit: <Wallet className="h-4 w-4" />,
    "avg-profit": <TrendingUp className="h-4 w-4" />,
    "avg-margin": <Scale className="h-4 w-4" />,
    "unsold-projected": <Target className="h-4 w-4" />,
    "prediction-accuracy": <Activity className="h-4 w-4" />,
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.id}
          title={item.title}
          value={item.value}
          description={item.description}
          trend={item.trend}
          variant={item.variant}
          icon={iconById[item.id]}
          density="compact"
        />
      ))}
    </div>
  );
}
