import type { DashboardActionItem } from "../types";

type Props = {
  actions: DashboardActionItem[];
  onNavigate: (route: DashboardActionItem["route"]) => void;
};

export function DashboardActionRequiredCard({ actions, onNavigate }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5 backdrop-blur-sm">
      <div className="mb-3 text-sm font-medium">Action Required</div>
      {actions.length === 0 ? (
        <p className="text-sm text-farm-muted">No high-priority actions right now.</p>
      ) : (
        <div className="space-y-2">
          {actions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.route)}
              className="w-full rounded-lg border border-farm-600/40 bg-farm-900/50 p-3 text-left transition hover:bg-farm-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{item.title}</div>
                  <div className="mt-1 text-xs text-farm-muted">{item.detail}</div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.variant === "danger" ? "bg-farm-danger/20 text-farm-danger" : "bg-farm-warning/20 text-farm-warning"}`}
                >
                  {item.variant === "danger" ? "Critical" : "Warning"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
