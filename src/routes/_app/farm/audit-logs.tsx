import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useAuditLogs } from "@/features/farm/hooks/useAuditLogs";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";

export const Route = createFileRoute("/_app/farm/audit-logs")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const { currentFarm, currentRole } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const canView = can("viewAuditLogs");
  const logsQuery = useAuditLogs(currentFarm.id, canView);
  const logs = logsQuery.data ?? [];

  if (!canView) {
    return (
      <div>
        <PageHeader
          title="Audit Logs"
          description="Every meaningful change is recorded here for traceability."
        />
        <div className="rounded-2xl border bg-farm-800/80 p-8 text-center text-sm text-farm-muted">
          Your role does not have access to audit logs.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Every meaningful change is recorded here for traceability."
      />
      <div className="rounded-2xl border bg-farm-800/80 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">User</th>
              <th className="text-left px-5 py-3 font-medium">Action</th>
              <th className="text-left px-5 py-3 font-medium">Entity</th>
              <th className="text-left px-5 py-3 font-medium">Description</th>
              <th className="text-left px-5 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {logsQuery.isLoading && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-muted" colSpan={5}>
                  Loading audit logs...
                </td>
              </tr>
            )}
            {logsQuery.isError && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-danger" colSpan={5}>
                  Could not load audit logs.
                </td>
              </tr>
            )}
            {!logsQuery.isLoading && logs.length === 0 && (
              <tr>
                <td className="px-5 py-8 text-center text-farm-muted" colSpan={5}>
                  No audit logs found.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3">
                  <div>{log.actorName}</div>
                  {log.actorEmail && (
                    <div className="text-xs text-farm-muted">{log.actorEmail}</div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-farm-lime/10 text-farm-lime text-[11px] font-mono px-2 py-0.5">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-farm-muted">
                  {log.entityType}
                  {log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="px-5 py-3">{log.description}</td>
                <td className="px-5 py-3 text-farm-muted">
                  {formatDistanceToNow(new Date(log.createdAt))} ago
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
