import { StatCard } from "@/shared/components/ui/StatCard";
import type { ReportSummaryItem } from "../types/report.types";

type Props = {
  items: ReportSummaryItem[];
};

export function ReportSummaryCards({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.id}
          title={item.title}
          value={item.value}
          description={item.description}
          trend={item.trend}
          variant={item.variant}
        />
      ))}
    </div>
  );
}
