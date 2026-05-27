import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";

export const Route = createFileRoute("/_app/feed/types")({
  component: () => (
    <div>
      <PageHeader title="Feed Types" description="Catalog of feed products available to the farm." />
      <div className="rounded-2xl border bg-farm-800/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-farm-900/60 text-farm-muted text-xs uppercase tracking-wider">
            <tr><th className="text-left px-5 py-3 font-medium">Name</th><th className="text-left px-5 py-3 font-medium">Cost / kg</th><th className="text-left px-5 py-3 font-medium">Protein %</th></tr>
          </thead>
          <tbody>
            {[
              { n: "Maize Mix", c: 0.42, p: 12 },
              { n: "Premium Pellet", c: 0.78, p: 18 },
              { n: "Silage Blend", c: 0.21, p: 9 },
            ].map((r) => (
              <tr key={r.n} className="border-t border-farm-600/30 hover:bg-farm-700/30">
                <td className="px-5 py-3">{r.n}</td>
                <td className="px-5 py-3">${r.c.toFixed(2)}</td>
                <td className="px-5 py-3">{r.p}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
});
