import { Info, TrendingUp, TriangleAlert } from "lucide-react";
import type { MarketInsight } from "../types/market.types";

type Props = {
  insights: MarketInsight[];
};

function icon(severity: MarketInsight["severity"]) {
  if (severity === "success") return <TrendingUp className="h-4 w-4" />;
  if (severity === "warning") return <TriangleAlert className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function className(severity: MarketInsight["severity"]) {
  if (severity === "success") return "bg-emerald-500/15 text-emerald-200";
  if (severity === "warning") return "bg-amber-500/15 text-amber-200";
  return "bg-farm-lime/15 text-farm-lime";
}

export function MarketInsightsPanel({ insights }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80 p-5">
      <div className="text-sm font-medium text-foreground">Market Insights</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.id} className="flex gap-3 rounded-lg border border-farm-600/30 bg-farm-900/40 p-3">
            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${className(insight.severity)}`}>
              {icon(insight.severity)}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{insight.title}</div>
              <div className="mt-1 text-sm text-farm-muted">{insight.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
