import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  healthy: number;
  watch: number;
  atRisk: number;
  critical: number;
  isRunning: boolean;
  onRunAssessment: () => void;
};

export function DashboardHealthSummaryCard({
  healthy,
  watch,
  atRisk,
  critical,
  isRunning,
  onRunAssessment,
}: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="text-sm font-medium">Health Risk Summary</div>
        <Button
          type="button"
          variant="outline"
          onClick={onRunAssessment}
          disabled={isRunning}
          className="w-full justify-start sm:w-auto sm:justify-center"
        >
          <HeartPulse className="h-4 w-4" />
          {isRunning ? "Running..." : "Run Health Scan"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3 text-center">
          <div className="text-xs text-farm-muted">Healthy</div>
          <div className="mt-1 text-lg font-semibold text-farm-success">{healthy}</div>
        </div>
        <div className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3 text-center">
          <div className="text-xs text-farm-muted">Watch</div>
          <div className="mt-1 text-lg font-semibold text-farm-warning">{watch}</div>
        </div>
        <div className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3 text-center">
          <div className="text-xs text-farm-muted">At Risk</div>
          <div className="mt-1 text-lg font-semibold text-farm-warning">{atRisk}</div>
        </div>
        <div className="rounded-lg border border-farm-600/40 bg-farm-900/40 p-3 text-center">
          <div className="text-xs text-farm-muted">Critical</div>
          <div className="mt-1 text-lg font-semibold text-farm-danger">{critical}</div>
        </div>
      </div>
    </div>
  );
}
