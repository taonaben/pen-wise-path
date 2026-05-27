import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

export const Route = createFileRoute("/_app/animals/alerts")({
  component: AlertsPage,
});

const alerts = [
  { tag: "TAG-003", title: "ADG below threshold", sev: "high" as const, when: "3 hr ago" },
  { tag: "TAG-004", title: "Weight loss detected", sev: "critical" as const, when: "Yesterday" },
  { tag: "TAG-012", title: "Feed conversion ratio rising", sev: "medium" as const, when: "2 days ago" },
];

const sevToVariant = {
  low: "default",
  medium: "warning",
  high: "warning",
  critical: "danger",
} as const;

function AlertsPage() {
  return (
    <div>
      <PageHeader title="Growth Alerts" description="Animals showing abnormal growth or feed conversion patterns." />
      <div className="space-y-3">
        {alerts.map((a, i) => (
          <div key={i} className="rounded-2xl border bg-farm-800/80 p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-farm-lime text-sm">{a.tag}</span>
                <StatusBadge status={a.sev} variant={sevToVariant[a.sev]} />
              </div>
              <div className="text-sm mt-1">{a.title}</div>
            </div>
            <div className="text-xs text-farm-muted">{a.when}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
