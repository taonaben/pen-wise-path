import type { AuditLogViewModel } from "@/features/farm/types/farm.types";
import { toShortDate } from "../lib/format";

type Props = {
  canViewAuditLogs: boolean;
  auditLogs: AuditLogViewModel[];
};

export function DashboardRecentActivityCard({ canViewAuditLogs, auditLogs }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-3 text-sm font-medium">Recent Activity</div>
      {!canViewAuditLogs ? (
        <p className="text-sm text-farm-muted">You do not have permission to view audit logs.</p>
      ) : auditLogs.length === 0 ? (
        <p className="text-sm text-farm-muted">No recent activity recorded.</p>
      ) : (
        <div className="space-y-2">
          {auditLogs.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3">
              <div className="text-sm font-medium">{item.description}</div>
              <div className="mt-1 text-xs text-farm-muted">
                {item.actorName} · {toShortDate(item.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
