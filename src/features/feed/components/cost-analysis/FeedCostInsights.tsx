import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { FeedCostInsight } from "../../types/feedCostAnalysis.types";

type Props = {
  insights: FeedCostInsight[];
};

function iconForSeverity(severity: FeedCostInsight["severity"]) {
  if (severity === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4" />;
  if (severity === "danger") return <XCircle className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function severityClass(severity: FeedCostInsight["severity"]) {
  if (severity === "success") return "text-emerald-200 bg-emerald-500/15";
  if (severity === "warning") return "text-amber-200 bg-amber-500/15";
  if (severity === "danger") return "text-farm-danger bg-farm-danger/15";
  return "text-farm-lime bg-farm-lime/15";
}

export function FeedCostInsights({ insights }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80 p-5">
      <div className="text-sm font-medium text-foreground">Cost Insights</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex gap-3 rounded-lg border border-farm-600/30 bg-farm-900/40 p-3"
          >
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${severityClass(insight.severity)}`}
            >
              {iconForSeverity(insight.severity)}
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
