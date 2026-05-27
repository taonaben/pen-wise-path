import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type { HealthEvent } from "../../types/animal.types";

type Props = {
  events: HealthEvent[];
  isLoading: boolean;
};

const severityVariant = {
  low: "default",
  medium: "warning",
  high: "warning",
  critical: "danger",
} as const;

export function AnimalHealthTab({ events, isLoading }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80">
      <div className="border-b border-farm-600/30 p-5">
        <h2 className="text-base font-semibold">Health Events</h2>
        <p className="mt-1 text-sm text-farm-muted">
          Light health notes, treatment records, and recovery status.
        </p>
      </div>

      <div className="divide-y divide-farm-600/30">
        {events.map((event) => (
          <div key={event.id} className="grid gap-3 p-5 md:grid-cols-[160px_1fr_auto]">
            <div className="text-sm text-farm-muted">{event.event_date}</div>
            <div>
              <div className="font-medium">{event.title}</div>
              <p className="mt-1 text-sm text-farm-muted">{event.notes ?? "No notes recorded."}</p>
              {event.treatment && (
                <p className="mt-2 text-sm text-farm-muted">Treatment: {event.treatment}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <StatusBadge status={event.severity} variant={severityVariant[event.severity]} />
              <StatusBadge status={event.status} />
            </div>
          </div>
        ))}
      </div>

      {isLoading && <div className="p-5 text-sm text-farm-muted">Loading health events...</div>}
      {!isLoading && events.length === 0 && (
        <div className="p-5 text-sm text-farm-muted">No health events recorded.</div>
      )}
    </div>
  );
}
