import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportInsight } from "../types/report.types";

type Props = {
  insights: ReportInsight[];
};

const severityStyles = {
  info: {
    icon: Info,
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-200",
  },
  success: {
    icon: CheckCircle2,
    border: "border-farm-success/40",
    bg: "bg-farm-success/10",
    text: "text-farm-success",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-farm-warning/40",
    bg: "bg-farm-warning/10",
    text: "text-farm-warning",
  },
  danger: {
    icon: ShieldAlert,
    border: "border-farm-danger/40",
    bg: "bg-farm-danger/10",
    text: "text-farm-danger",
  },
} as const;

export function ReportInsightsPanel({ insights }: Props) {
  return (
    <section className="rounded-2xl border bg-farm-800/70 p-5">
      <h2 className="font-semibold">Insights</h2>
      <p className="text-sm text-farm-muted">Automated findings to guide farm decisions.</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {insights.length === 0 ? (
          <div className="rounded-xl border border-farm-600/40 bg-farm-900/40 p-4 text-sm text-farm-muted">
            No insights available for this date range.
          </div>
        ) : (
          insights.map((insight) => {
            const style = severityStyles[insight.severity];
            const Icon = style.icon;
            return (
              <div key={insight.id} className={cn("rounded-xl border p-4", style.border, style.bg)}>
                <div className={cn("mb-2 flex items-center gap-2 text-sm font-medium", style.text)}>
                  <Icon className="h-4 w-4" />
                  {insight.title}
                </div>
                <p className="text-sm text-farm-muted">{insight.detail}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
