import type { PenUtilizationItem } from "../types";

type Props = {
  penUtilization: PenUtilizationItem[];
};

export function DashboardPenUtilizationCard({ penUtilization }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-4 backdrop-blur-sm sm:p-5 xl:col-span-1">
      <div className="mb-3 text-sm font-medium">Top Pen Utilization</div>
      <div className="space-y-2">
        {penUtilization.length === 0 ? (
          <p className="text-sm text-farm-muted">No pens found.</p>
        ) : (
          penUtilization.map((item) => (
            <div key={item.id} className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-farm-muted">
                  {item.occupancy}/{item.capacity || "-"}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-farm-700">
                <div
                  className={`h-1.5 rounded-full ${item.utilization >= 90 ? "bg-farm-danger" : item.utilization >= 70 ? "bg-farm-warning" : "bg-farm-lime"}`}
                  style={{ width: `${Math.min(item.utilization, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
