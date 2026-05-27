import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";

export const Route = createFileRoute("/_app/animals/")({
  component: AnimalsPage,
});

const animals = [
  { id: "001", tag: "TAG-001", breed: "Angus", weight: 385, adg: 0.92, cost: 142, perf: "Normal", status: "Active", rec: "Sell in 30 days", variant: "default" as const },
  { id: "002", tag: "TAG-002", breed: "Brahman", weight: 410, adg: 1.10, cost: 158, perf: "Excellent", status: "Active", rec: "Hold", variant: "success" as const },
  { id: "003", tag: "TAG-003", breed: "Mashona", weight: 320, adg: 0.31, cost: 121, perf: "Underperforming", status: "Active", rec: "Inspect", variant: "warning" as const },
  { id: "004", tag: "TAG-004", breed: "Hereford", weight: 290, adg: -0.12, cost: 138, perf: "Critical", status: "Sick", rec: "Inspect immediately", variant: "danger" as const },
];

function AnimalsPage() {
  return (
    <div>
      <PageHeader title="All Animals" description="Every animal currently in the feedlot, with growth and cost signals." />
      <div className="rounded-2xl border bg-farm-800/80 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr>
              {["Tag","Breed","Current Weight","ADG","Feed Cost","Performance","Status","Recommendation","Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animals.map((a) => (
              <tr key={a.id} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3 font-mono text-farm-lime">{a.tag}</td>
                <td className="px-5 py-3">{a.breed}</td>
                <td className="px-5 py-3">{a.weight} kg</td>
                <td className="px-5 py-3">{a.adg.toFixed(2)} kg/d</td>
                <td className="px-5 py-3">${a.cost}</td>
                <td className="px-5 py-3"><StatusBadge status={a.perf} variant={a.variant} /></td>
                <td className="px-5 py-3 text-farm-muted">{a.status}</td>
                <td className="px-5 py-3 text-farm-muted">{a.rec}</td>
                <td className="px-5 py-3">
                  <Link to="/animals/$id" params={{ id: a.id }} className="text-farm-lime hover:underline text-xs">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
