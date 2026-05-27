import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";

export const Route = createFileRoute("/_app/farm/audit-logs")({
  component: AuditLogsPage,
});

const logs = [
  { user: "Tendai Moyo", action: "ANIMAL_CREATED", entity: "TAG-001", desc: "Created animal TAG-001 (Angus)", at: "2 min ago" },
  { user: "Farai Banda", action: "WEIGHT_RECORDED", entity: "TAG-001", desc: "Recorded 385 kg for TAG-001", at: "20 min ago" },
  { user: "Rumbi Chigodora", action: "MARKET_PRICE_UPDATED", entity: "MARKET", desc: "Updated market price to $3.20/kg", at: "1 hr ago" },
  { user: "System", action: "ALERT_GENERATED", entity: "TAG-003", desc: "Growth alert: ADG below threshold", at: "3 hr ago" },
  { user: "Farai Banda", action: "FEED_RECORDED", entity: "TAG-002", desc: "Recorded 12 kg of Maize Mix for TAG-002", at: "Yesterday" },
  { user: "Tendai Moyo", action: "ANIMAL_SOLD", entity: "TAG-019", desc: "Sold TAG-019 at $3.18/kg", at: "2 days ago" },
];

function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit Logs" description="Every meaningful change is recorded here for traceability." />
      <div className="rounded-2xl border bg-farm-800/80 overflow-hidden">
        <table className="w-full text-sm">
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
            {logs.map((l, i) => (
              <tr key={i} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3">{l.user}</td>
                <td className="px-5 py-3">
                  <span className="rounded-full bg-farm-lime/10 text-farm-lime text-[11px] font-mono px-2 py-0.5">{l.action}</span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-farm-muted">{l.entity}</td>
                <td className="px-5 py-3">{l.desc}</td>
                <td className="px-5 py-3 text-farm-muted">{l.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
