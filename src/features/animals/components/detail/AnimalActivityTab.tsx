import type { AuditLogViewModel } from "@/features/farm/types/farm.types";

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

      <div className="divide-y divide-farm-600/30">
        {logs.map((log) => (
          <div key={log.id} className="grid gap-2 p-5 md:grid-cols-[1fr_auto]">
            <div>
              <div className="font-medium">{log.description}</div>
              <p className="mt-1 text-sm text-farm-muted">
                {log.actorName} - {log.action} - {log.entityType}
              </p>
            </div>
            <div className="text-sm text-farm-muted">{log.createdAt.slice(0, 16)}</div>
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
