import type { AuditLogViewModel } from "@/features/farm/types/farm.types";
import { Activity } from "lucide-react";

type Props = {
  logs: AuditLogViewModel[];
  isLoading: boolean;
};

export function AnimalActivityTab({ logs, isLoading }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 p-5">
        <h2 className="text-base font-semibold">Activity</h2>
        <p className="mt-1 text-sm text-farm-muted">
          Audit events directly related to this animal.
        </p>
      </div>

      <div className="space-y-2 p-3 md:p-4">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-farm-600/30 bg-farm-900/45 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{log.description}</div>
                <p className="mt-1 text-sm text-farm-muted">
                  {log.actorName} - {log.action} - {log.entityType}
                </p>
              </div>
              <Activity className="h-4 w-4 shrink-0 text-farm-lime" />
            </div>
            <div className="mt-2 text-xs text-farm-muted">{log.createdAt.slice(0, 16)}</div>
          </div>
        ))}
      </div>

      {isLoading && <div className="p-5 text-sm text-farm-muted">Loading activity...</div>}
      {!isLoading && logs.length === 0 && (
        <div className="p-5 text-sm text-farm-muted">No animal-specific activity found.</div>
      )}
    </div>
  );
}
