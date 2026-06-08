import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  HeartPulse,
  Scale,
  ShieldAlert,
  Wheat,
} from "lucide-react";
import { StatCard } from "@/shared/components/ui/StatCard";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type {
  CreateHealthEventPayload,
  HealthAssessment,
  HealthEvent,
  HealthEventStatus,
  HealthEventType,
  HealthSeverity,
} from "../../types/animal.types";

type Props = {
  assessment: HealthAssessment | null;
  isAssessmentLoading: boolean;
  isRunningAssessment: boolean;
  isCreatingEvent: boolean;
  onRunAssessment: () => Promise<void>;
  onAddHealthEvent: (
    payload: Omit<CreateHealthEventPayload, "farmId" | "animalId">,
    runAssessmentAfterSave: boolean,
  ) => Promise<void>;
  events: HealthEvent[];
  isLoading: boolean;
};

const severityVariant = {
  low: "default",
  medium: "warning",
  high: "warning",
  critical: "danger",
} as const;

const healthStatusVariant = {
  healthy: "success",
  watch: "warning",
  at_risk: "warning",
  critical: "danger",
} as const;

const eventTypes: HealthEventType[] = [
  "observation",
  "illness",
  "injury",
  "treatment",
  "vaccination",
  "deworming",
  "inspection",
  "recovery",
  "other",
];

const statuses: HealthEventStatus[] = [
  "open",
  "under_treatment",
  "recovering",
  "resolved",
  "monitoring",
];

const severities: HealthSeverity[] = ["low", "medium", "high", "critical"];

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readSignalNumber(signals: Record<string, unknown>, key: string): number | null {
  const value = signals[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function AnimalHealthTab({
  assessment,
  isAssessmentLoading,
  isRunningAssessment,
  isCreatingEvent,
  onRunAssessment,
  onAddHealthEvent,
  events,
  isLoading,
}: Props) {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [runAssessmentAfterSave, setRunAssessmentAfterSave] = useState(true);
  const [eventType, setEventType] = useState<HealthEventType>("observation");
  const [severity, setSeverity] = useState<HealthSeverity>("low");
  const [status, setStatus] = useState<HealthEventStatus>("open");
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 10));
  const [symptoms, setSymptoms] = useState("");
  const [diagnosisNote, setDiagnosisNote] = useState("");
  const [treatmentGiven, setTreatmentGiven] = useState("");
  const [treatedBy, setTreatedBy] = useState("");
  const [recoveryNotes, setRecoveryNotes] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const signalSummary = useMemo(() => {
    const signals = (assessment?.signals ?? {}) as Record<string, unknown>;
    const fcr = readSignalNumber(signals, "fcr");
    const feedIntakeChange = readSignalNumber(signals, "feed_intake_change_percentage");
    const activeAlerts = readSignalNumber(signals, "active_growth_alerts");
    const activeHealthEvents = readSignalNumber(signals, "active_health_events");

    return {
      growth:
        assessment?.health_status === "healthy"
          ? "Normal"
          : assessment?.health_status === "watch"
            ? "Watch"
            : "Needs inspection",
      feedIntake:
        feedIntakeChange === null ? "Unknown" : feedIntakeChange <= -20 ? "Dropping" : "Stable",
      fcr: fcr === null ? "Unknown" : `FCR ${fcr.toFixed(2)}${fcr > 9 ? " (poor)" : ""}`,
      activeAlerts: activeAlerts === null ? "0" : String(Math.round(activeAlerts)),
      openHealthEvents: activeHealthEvents === null ? "0" : String(Math.round(activeHealthEvents)),
    };
  }, [assessment]);

  const submitHealthEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (!symptoms.trim() && !diagnosisNote.trim()) {
      setLocalError("Add symptoms or notes before saving the event.");
      return;
    }

    await onAddHealthEvent(
      {
        eventType,
        severity,
        status,
        observedAt,
        symptoms,
        diagnosisNote,
        treatmentGiven,
        treatedBy,
        recoveryNotes,
      },
      runAssessmentAfterSave,
    );

    setSymptoms("");
    setDiagnosisNote("");
    setTreatmentGiven("");
    setTreatedBy("");
    setRecoveryNotes("");
    setEventType("observation");
    setSeverity("low");
    setStatus("open");
    setObservedAt(new Date().toISOString().slice(0, 10));
    setIsAddFormOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-farm-800/80 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">AI Health Assessment</h2>
            <p className="mt-1 text-sm text-farm-muted">
              Risk scoring supports inspection decisions and does not diagnose disease.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void onRunAssessment()}
            disabled={isRunningAssessment}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRunningAssessment ? "Running assessment..." : "Run Health Assessment"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Health Status"
            value={assessment?.health_status.replace("_", " ") ?? "Not scanned"}
            description={
              assessment ? assessment.summary : "Run assessment to calculate risk status."
            }
            variant={assessment ? healthStatusVariant[assessment.health_status] : "default"}
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <StatCard
            title="AI Health Score"
            value={assessment ? `${assessment.health_score}%` : "--"}
            description={assessment ? `Risk level: ${assessment.risk_level}` : "No score yet"}
            variant={assessment ? healthStatusVariant[assessment.health_status] : "default"}
            icon={<HeartPulse className="h-4 w-4" />}
          />
          <StatCard
            title="Confidence"
            value={assessment?.confidence_label ?? "--"}
            description={
              assessment
                ? `${Math.round(assessment.confidence_score * 100)}% confidence`
                : "Confidence appears after first scan"
            }
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            title="Last AI Scan"
            value={assessment ? formatDate(assessment.created_at) : "Not run"}
            description={assessment?.recommended_action ?? "Recommended action appears after scan."}
            icon={<CalendarDays className="h-4 w-4" />}
          />
        </div>

        {isAssessmentLoading && (
          <div className="mt-3 text-sm text-farm-muted">Loading latest health assessment...</div>
        )}

        {assessment && (
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge
              status={assessment.health_status.replace("_", " ")}
              variant={healthStatusVariant[assessment.health_status]}
            />
            <StatusBadge status={`source: ${assessment.source}`} />
            <StatusBadge status={`engine: ${assessment.engine_version}`} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-farm-800/80 p-4 xl:grid-cols-5">
        <StatCard
          title="Growth"
          value={signalSummary.growth}
          icon={<Activity className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Intake"
          value={signalSummary.feedIntake}
          icon={<Scale className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="FCR"
          value={signalSummary.fcr}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Active Alerts"
          value={signalSummary.activeAlerts}
          icon={<AlertTriangle className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Health Events (Open)"
          value={signalSummary.openHealthEvents}
          icon={<CalendarDays className="h-4 w-4" />}
          density="compact"
        />
      </div>

      <div className="rounded-xl border bg-farm-800/80">
        <div className="flex flex-col gap-3 border-b border-farm-600/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Health Events</h2>
            <p className="mt-1 text-sm text-farm-muted">
              Manual health records, treatment notes, and recovery updates.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddFormOpen((value) => !value)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-farm-600/60 px-4 text-sm font-medium text-farm-muted hover:text-foreground"
          >
            {isAddFormOpen ? "Close Form" : "Add Health Event"}
          </button>
        </div>

        {isAddFormOpen && (
          <form onSubmit={submitHealthEvent} className="space-y-4 border-b border-farm-600/30 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Event Type</span>
                <select
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value as HealthEventType)}
                  className="h-10 w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Severity</span>
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as HealthSeverity)}
                  className="h-10 w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3"
                >
                  {severities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as HealthEventStatus)}
                  className="h-10 w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3"
                >
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Observed Date</span>
                <input
                  type="date"
                  value={observedAt}
                  onChange={(event) => setObservedAt(event.target.value)}
                  className="h-10 w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Symptoms / Notes</span>
                <textarea
                  value={symptoms}
                  onChange={(event) => setSymptoms(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Diagnosis / Observation Detail</span>
                <textarea
                  value={diagnosisNote}
                  onChange={(event) => setDiagnosisNote(event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Treatment Given</span>
                <textarea
                  value={treatmentGiven}
                  onChange={(event) => setTreatmentGiven(event.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Recovery Notes</span>
                <textarea
                  value={recoveryNotes}
                  onChange={(event) => setRecoveryNotes(event.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3 py-2"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-farm-muted">Vet / Treated By</span>
                <input
                  type="text"
                  value={treatedBy}
                  onChange={(event) => setTreatedBy(event.target.value)}
                  className="h-10 w-full rounded-md border border-farm-600/60 bg-farm-900/60 px-3"
                />
              </label>

              <label className="flex items-center gap-2 self-end text-sm text-farm-muted">
                <input
                  type="checkbox"
                  checked={runAssessmentAfterSave}
                  onChange={(event) => setRunAssessmentAfterSave(event.target.checked)}
                />
                Run AI health assessment after save
              </label>
            </div>

            {localError && (
              <div className="rounded-md border border-farm-danger/30 bg-farm-danger/10 p-3 text-sm text-farm-danger">
                {localError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isCreatingEvent}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingEvent ? "Saving..." : "Save Health Event"}
              </button>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-farm-600/60 px-4 text-sm font-medium text-farm-muted hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-farm-600/30">
          {events.map((event) => (
            <div key={event.id} className="grid gap-3 p-5 md:grid-cols-[160px_1fr_auto]">
              <div className="text-sm text-farm-muted">
                {formatDate(event.observed_at ?? event.event_date)}
              </div>
              <div>
                <div className="font-medium">{event.title}</div>
                <p className="mt-1 text-sm text-farm-muted">
                  {event.symptoms ?? event.notes ?? "No notes recorded."}
                </p>
                {(event.treatment_given ?? event.treatment) && (
                  <p className="mt-2 text-sm text-farm-muted">
                    Treatment: {event.treatment_given ?? event.treatment}
                  </p>
                )}
                {event.treated_by && (
                  <p className="mt-1 text-xs text-farm-muted">Recorded by: {event.treated_by}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <StatusBadge status={event.severity} variant={severityVariant[event.severity]} />
                <StatusBadge status={event.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading && <div className="p-5 text-sm text-farm-muted">Loading health events...</div>}
      {!isLoading && events.length === 0 && (
        <div className="p-5 text-sm text-farm-muted">No health events recorded.</div>
      )}
    </div>
  );
}
