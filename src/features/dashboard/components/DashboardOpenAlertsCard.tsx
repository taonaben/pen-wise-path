import type { GrowthAlert } from "@/features/animals/services/growthAlertApi";
import { getSeverityBadgeClass } from "../lib/format";

type Props = {
  openAlerts: GrowthAlert[];
};

export function DashboardOpenAlertsCard({ openAlerts }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5 backdrop-blur-sm">
      <div className="mb-3 text-sm font-medium">Open Growth Alerts</div>
      <div className="space-y-2">
        {openAlerts.length === 0 ? (
          <p className="text-sm text-farm-muted">No open growth alerts.</p>
        ) : (
          openAlerts.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{item.title}</div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${getSeverityBadgeClass(item.severity)}`}
                >
                  {item.severity}
                </span>
              </div>
              <div className="mt-1 text-xs text-farm-muted">{item.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
