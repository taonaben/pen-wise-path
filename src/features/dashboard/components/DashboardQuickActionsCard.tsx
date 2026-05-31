import { AlertTriangle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isRunningGrowthScan: boolean;
  isRunningPredictionScan: boolean;
  onNavigateToWeights: () => void;
  onNavigateToFeedRecords: () => void;
  onNavigateToSales: () => void;
  onRunGrowthScan: () => void;
  onRunPredictionScan: () => void;
};

export function DashboardQuickActionsCard({
  isRunningGrowthScan,
  isRunningPredictionScan,
  onNavigateToWeights,
  onNavigateToFeedRecords,
  onNavigateToSales,
  onRunGrowthScan,
  onRunPredictionScan,
}: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5 backdrop-blur-sm">
      <div className="mb-3 text-sm font-medium">Quick Actions</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={onNavigateToWeights}>
          Record Weight
        </Button>
        <Button type="button" variant="outline" onClick={onNavigateToFeedRecords}>
          Record Feeding
        </Button>
        <Button type="button" variant="outline" onClick={onNavigateToSales}>
          Record Sale
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRunGrowthScan}
          disabled={isRunningGrowthScan}
        >
          <AlertTriangle className="h-4 w-4" />
          {isRunningGrowthScan ? "Running..." : "Run Growth Scan"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRunPredictionScan}
          disabled={isRunningPredictionScan}
          className="sm:col-span-2"
        >
          <Brain className="h-4 w-4" />
          {isRunningPredictionScan ? "Running..." : "Run Selling Predictions"}
        </Button>
      </div>
    </div>
  );
}
