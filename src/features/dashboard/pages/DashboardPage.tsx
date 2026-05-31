import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAnimals } from "@/features/animals/hooks/useAnimals";
import { useGenerateGrowthAlerts } from "@/features/animals/hooks/useGenerateGrowthAlerts";
import { useGrowthAlerts } from "@/features/animals/hooks/useGrowthAlerts";
import { usePenManagement } from "@/features/animals/hooks/usePenManagement";
import {
  getDefaultFeedCostAnalysisFilters,
  useFeedCostAnalysis,
} from "@/features/feed/hooks/useFeedCostAnalysis";
import { useFeedInventory } from "@/features/feed/hooks/useFeedInventory";
import { useAuditLogs } from "@/features/farm/hooks/useAuditLogs";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useFarmPermissions } from "@/features/farm/hooks/useFarmPermissions";
import { useGenerateSellingPredictions } from "@/features/market/hooks/useGenerateSellingPredictions";
import { useSalesAnalytics } from "@/features/market/hooks/useSalesRecords";
import { useSellingPredictions } from "@/features/market/hooks/useSellingPredictions";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { DashboardActionRequiredCard } from "../components/DashboardActionRequiredCard";
import { DashboardOpenAlertsCard } from "../components/DashboardOpenAlertsCard";
import { DashboardOpportunitiesCard } from "../components/DashboardOpportunitiesCard";
import { DashboardPenUtilizationCard } from "../components/DashboardPenUtilizationCard";
import { DashboardQuickActionsCard } from "../components/DashboardQuickActionsCard";
import { DashboardRecentActivityCard } from "../components/DashboardRecentActivityCard";
import { DashboardSnapshotCards } from "../components/DashboardSnapshotCards";
import { DashboardTrendsGrid } from "../components/DashboardTrendsGrid";
import type { DashboardActionItem, PenUtilizationItem } from "../types";
import { getLast30DaySalesFilters } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentFarm, currentRole } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const canViewAuditLogs = can("viewAuditLogs");

  const animalFilters = useMemo(
    () => ({
      status: "active" as const,
      performance: "all" as const,
      sex: "all" as const,
    }),
    [],
  );
  const salesFilters = useMemo(() => getLast30DaySalesFilters(), []);
  const feedFilters = useMemo(() => getDefaultFeedCostAnalysisFilters(), []);

  const animalsQuery = useAnimals(currentFarm.id, animalFilters);
  const alertsQuery = useGrowthAlerts(currentFarm.id);
  const feedInventoryQuery = useFeedInventory(currentFarm.id);
  const feedCostQuery = useFeedCostAnalysis(currentFarm.id, feedFilters);
  const salesAnalyticsQuery = useSalesAnalytics(currentFarm.id, salesFilters);
  const sellingPredictionsQuery = useSellingPredictions(currentFarm.id);
  const penManagementQuery = usePenManagement(currentFarm.id);
  const auditLogsQuery = useAuditLogs(currentFarm.id, canViewAuditLogs);
  const runGrowthScan = useGenerateGrowthAlerts(currentFarm.id);
  const runSellingPredictions = useGenerateSellingPredictions(currentFarm.id);

  const activeAnimalsSummary = animalsQuery.data?.summary;
  const alerts = alertsQuery.data ?? [];
  const inventoryRows = feedInventoryQuery.data?.rows ?? [];
  const salesAnalytics = salesAnalyticsQuery.analytics;
  const salesRows = salesAnalyticsQuery.data ?? [];
  const predictions = sellingPredictionsQuery.data?.predictions ?? [];
  const pens = penManagementQuery.data?.pens ?? [];
  const assignments = penManagementQuery.data?.assignments ?? [];
  const auditLogs = auditLogsQuery.data ?? [];

  const openAlerts = useMemo(
    () => alerts.filter((item) => item.status === "open" || item.status === "reviewing"),
    [alerts],
  );
  const criticalAlerts = useMemo(
    () => openAlerts.filter((item) => item.severity === "critical"),
    [openAlerts],
  );
  const lowStockRows = useMemo(() => inventoryRows.filter((row) => row.lowStock), [inventoryRows]);
  const unpaidSales = useMemo(
    () => salesRows.filter((row) => row.paymentStatus !== "paid" && row.saleStatus !== "cancelled"),
    [salesRows],
  );

  const penUtilization = useMemo<PenUtilizationItem[]>(() => {
    const counts = new Map<string, number>();
    for (const assignment of assignments) {
      counts.set(assignment.pen_id, (counts.get(assignment.pen_id) ?? 0) + 1);
    }

    return pens
      .map((pen) => {
        const occupancy = counts.get(pen.id) ?? 0;
        const capacity = Number(pen.capacity ?? 0);
        const utilization = capacity > 0 ? (occupancy / capacity) * 100 : 0;
        return {
          id: pen.id,
          name: pen.name,
          occupancy,
          capacity,
          utilization,
        };
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 6);
  }, [assignments, pens]);

  const opportunities = useMemo(
    () =>
      predictions
        .filter((item) => item.recommendation === "SELL_NOW" || item.recommendation === "WATCH")
        .sort((a, b) => (b.expectedProfit ?? 0) - (a.expectedProfit ?? 0))
        .slice(0, 5),
    [predictions],
  );

  const actions = useMemo<DashboardActionItem[]>(() => {
    const rows: DashboardActionItem[] = [];

    if (criticalAlerts.length > 0) {
      rows.push({
        id: "critical-alerts",
        title: `${criticalAlerts.length} critical alert(s) require action`,
        detail: "Review and resolve high-risk growth anomalies.",
        route: "/animals/alerts",
        variant: "danger",
      });
    }

    if (unpaidSales.length > 0) {
      rows.push({
        id: "unpaid-sales",
        title: `${unpaidSales.length} sale(s) pending payment`,
        detail: "Follow up with buyers and close outstanding payments.",
        route: "/market/sales",
        variant: "warning",
      });
    }

    if (lowStockRows.length > 0) {
      rows.push({
        id: "low-stock",
        title: `${lowStockRows.length} low-stock feed item(s)`,
        detail: "Replenish inventory before the next feeding cycle.",
        route: "/feed/types",
        variant: "warning",
      });
    }

    return rows;
  }, [criticalAlerts.length, lowStockRows.length, unpaidSales.length]);

  const onRefreshAll = async () => {
    await Promise.all([
      animalsQuery.refetch(),
      alertsQuery.refetch(),
      feedInventoryQuery.refetch(),
      feedCostQuery.refetch(),
      salesAnalyticsQuery.refetch(),
      sellingPredictionsQuery.refetch(),
      penManagementQuery.refetch(),
      canViewAuditLogs ? auditLogsQuery.refetch() : Promise.resolve(),
    ]);
    toast.success("Dashboard refreshed");
  };

  const onRunGrowthScan = async () => {
    try {
      await runGrowthScan.mutateAsync({ mode: "farm_scan" });
      toast.success("Growth alerts scan complete");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run growth scan");
    }
  };

  const onRunPredictionScan = async () => {
    try {
      await runSellingPredictions.mutateAsync();
      toast.success("Selling predictions refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run prediction scan");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Today’s feedlot performance, growth, and market signals at a glance."
        action={
          <Button type="button" variant="outline" onClick={onRefreshAll}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <DashboardSnapshotCards
        activeAnimalsSummary={activeAnimalsSummary}
        feedCost={feedCostQuery.data}
        predictions={predictions}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardActionRequiredCard
          actions={actions}
          onNavigate={(route) => navigate({ to: route })}
        />
        <DashboardQuickActionsCard
          isRunningGrowthScan={runGrowthScan.isPending}
          isRunningPredictionScan={runSellingPredictions.isPending}
          onNavigateToWeights={() => navigate({ to: "/animals/weights" })}
          onNavigateToFeedRecords={() => navigate({ to: "/feed/records" })}
          onNavigateToSales={() => navigate({ to: "/market/sales" })}
          onRunGrowthScan={onRunGrowthScan}
          onRunPredictionScan={onRunPredictionScan}
        />
      </div>

      <DashboardTrendsGrid salesAnalytics={salesAnalytics} feedCost={feedCostQuery.data} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardPenUtilizationCard penUtilization={penUtilization} />
        <DashboardOpportunitiesCard
          opportunities={opportunities}
          onNavigateToPredictions={() => navigate({ to: "/market/predictions" })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardOpenAlertsCard openAlerts={openAlerts} />
        <DashboardRecentActivityCard canViewAuditLogs={canViewAuditLogs} auditLogs={auditLogs} />
      </div>
    </div>
  );
}
