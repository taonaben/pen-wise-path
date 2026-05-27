import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

export const Route = createFileRoute("/_app/market/predictions")({
  component: PredictionsPage,
});

const rows = [
  { tag: "TAG-001", w: 385, p14: 38, p30: 92, win: "Day 28–35", rec: "Sell in window", v: "success" as const },
  { tag: "TAG-002", w: 410, p14: 71, p30: 142, win: "Day 40–55", rec: "Hold", v: "default" as const },
  { tag: "TAG-003", w: 320, p14: -8, p30: -2, win: "—", rec: "Inspect", v: "warning" as const },
  { tag: "TAG-004", w: 290, p14: -22, p30: -45, win: "—", rec: "Sell immediately", v: "danger" as const },
];

function PredictionsPage() {
  return (
    <div>
      <PageHeader title="Selling Predictions" description="Estimated profit windows for each animal." />
      <div className="rounded-2xl border bg-farm-800/80 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr>{["Animal","Current Weight","14-Day Profit","30-Day Profit","Best Window","Recommendation"].map((h) => (
              <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.tag} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3 font-mono text-farm-lime">{r.tag}</td>
                <td className="px-5 py-3">{r.w} kg</td>
                <td className={"px-5 py-3 " + (r.p14 >= 0 ? "text-farm-success" : "text-farm-danger")}>${r.p14}</td>
                <td className={"px-5 py-3 " + (r.p30 >= 0 ? "text-farm-success" : "text-farm-danger")}>${r.p30}</td>
                <td className="px-5 py-3 text-farm-muted">{r.win}</td>
                <td className="px-5 py-3"><StatusBadge status={r.rec} variant={r.v} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
