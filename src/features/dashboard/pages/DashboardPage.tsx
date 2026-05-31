import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAnimals } from "@/features/animals/hooks/useAnimals";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { useGenerateGrowthAlerts } from "@/features/animals/hooks/useGenerateGrowthAlerts";
import { useGenerateHealthAssessments } from "@/features/animals/hooks/useGenerateHealthAssessments";
import { useGrowthAlerts } from "@/features/animals/hooks/useGrowthAlerts";
import { usePenManagement } from "@/features/animals/hooks/usePenManagement";
import { usePens } from "@/features/animals/hooks/usePens";
import { healthService } from "@/features/animals/services/healthService";
import { weightService } from "@/features/animals/services/weightService";
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
import { DashboardFilterBar } from "../components/DashboardFilterBar";
import { DashboardHealthSummaryCard } from "../components/DashboardHealthSummaryCard";
import { DashboardOpenAlertsCard } from "../components/DashboardOpenAlertsCard";
import { DashboardOpportunitiesCard } from "../components/DashboardOpportunitiesCard";
import { DashboardPenUtilizationCard } from "../components/DashboardPenUtilizationCard";
import { DashboardQuickActionsCard } from "../components/DashboardQuickActionsCard";
import { DashboardRecentActivityCard } from "../components/DashboardRecentActivityCard";
import { DashboardSnapshotCards } from "../components/DashboardSnapshotCards";
import { DashboardTrendsGrid } from "../components/DashboardTrendsGrid";
import { readDashboardStateFromUrl, writeDashboardStateToUrl } from "../lib/dashboardUrlState";
import type { DashboardActionItem, PenUtilizationItem } from "../types";
import { getDefaultDashboardFilters, getLast30DaySalesFilters } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentFarm, currentRole } = useCurrentFarm();
  const { can } = useFarmPermissions(currentRole);
  const canViewAuditLogs = can("viewAuditLogs");

  const [filters, setFilters] = useState(() =>
    readDashboardStateFromUrl(getDefaultDashboardFilters()),
  );

  useEffect(() => {
    writeDashboardStateToUrl(filters);
  }, [filters]);

  const animalFilters = useMemo(
    () => ({
      status: "active" as const,
      performance: "all" as const,
      sex: "all" as const,
      speciesId: filters.speciesId,
    }),
    [filters.speciesId],
  );
  const salesFilters = useMemo(
    () => ({
      ...getLast30DaySalesFilters(),
      dateFrom: filters.startDate,
      dateTo: filters.endDate,
      speciesId: filters.speciesId,
    }),
    [filters.endDate, filters.speciesId, filters.startDate],
  );
  const feedFilters = useMemo(
    () => ({
      ...getDefaultFeedCostAnalysisFilters(),
      startDate: filters.startDate,
      endDate: filters.endDate,
      speciesId: filters.speciesId,
      penId: filters.penId,
      animalStatus: "active" as const,
    }),
    [filters.endDate, filters.penId, filters.speciesId, filters.startDate],
  );

  const speciesQuery = useAnimalSpecies();
  const pensQuery = usePens(currentFarm.id);
  const animalsQuery = useAnimals(currentFarm.id, animalFilters);
  const alertsQuery = useGrowthAlerts(currentFarm.id);
  const feedInventoryQuery = useFeedInventory(currentFarm.id);
  const feedCostQuery = useFeedCostAnalysis(currentFarm.id, feedFilters);
  const salesAnalyticsQuery = useSalesAnalytics(currentFarm.id, salesFilters);
  const sellingPredictionsQuery = useSellingPredictions(currentFarm.id);
  const penManagementQuery = usePenManagement(currentFarm.id);
  const auditLogsQuery = useAuditLogs(currentFarm.id, canViewAuditLogs);
  const runGrowthScan = useGenerateGrowthAlerts(currentFarm.id);
  const runHealthAssessments = useGenerateHealthAssessments(currentFarm.id);
  const runSellingPredictions = useGenerateSellingPredictions(currentFarm.id);
  const weightsQuery = useQuery({
    queryKey: ["dashboard-weight-records", currentFarm.id],
    queryFn: () => weightService.getWeightRecords(currentFarm.id),
    enabled: Boolean(currentFarm.id),
  });

  const activeAnimals = animalsQuery.data?.animals ?? [];
  const alerts = alertsQuery.data ?? [];
  const inventoryRows = feedInventoryQuery.data?.rows ?? [];
  const salesAnalytics = salesAnalyticsQuery.analytics;
  const salesRows = salesAnalyticsQuery.data ?? [];
  const predictions = sellingPredictionsQuery.data?.predictions ?? [];
  const pens = penManagementQuery.data?.pens ?? [];
  const assignments = penManagementQuery.data?.assignments ?? [];
  const auditLogs = auditLogsQuery.data ?? [];

  const selectedAnimalIds = useMemo(() => {
    if (!filters.penId) return new Set(activeAnimals.map((animal) => animal.id));

    const ids = new Set(
      assignments
        .filter((assignment) => assignment.pen_id === filters.penId)
        .map((assignment) => assignment.animal_id),
    );
    return ids;
  }, [activeAnimals, assignments, filters.penId]);

  const filteredAnimals = useMemo(() => {
    if (!filters.penId) return activeAnimals;
    return activeAnimals.filter((animal) => selectedAnimalIds.has(animal.id));
  }, [activeAnimals, filters.penId, selectedAnimalIds]);

  const filteredAnimalIds = useMemo(
    () => filteredAnimals.map((animal) => animal.id),
    [filteredAnimals],
  );

  const healthAssessmentsQuery = useQuery({
    queryKey: ["dashboard-health-assessments", currentFarm.id, filteredAnimalIds],
    queryFn: () => healthService.getLatestFarmHealthAssessments(currentFarm.id, filteredAnimalIds),
    enabled: Boolean(currentFarm.id && filteredAnimalIds.length > 0),
  });

  const activeAnimalsSummary = useMemo(() => {
    return {
      total: filteredAnimals.length,
      cattle: filteredAnimals.filter((animal) => animal.speciesSlug === "cattle").length,
      pigs: filteredAnimals.filter((animal) => animal.speciesSlug === "pigs").length,
      goats: filteredAnimals.filter((animal) => animal.speciesSlug === "goats").length,
      underperforming: filteredAnimals.filter((animal) =>
        ["Critical", "Underperforming"].includes(animal.performance),
      ).length,
      readyForSale: filteredAnimals.filter((animal) => animal.recommendation === "Ready for sale")
        .length,
    };
  }, [filteredAnimals]);

  const latestWeightsByAnimal = useMemo(() => {
    const byAnimal = new Map<string, string>();
    for (const record of weightsQuery.data ?? []) {
      if (!byAnimal.has(record.animal_id)) {
        byAnimal.set(record.animal_id, record.recorded_at);
      }
    }
    return byAnimal;
  }, [weightsQuery.data]);

  const overdueWeightAnimalsCount = useMemo(() => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);

    return filteredAnimals.filter((animal) => {
      const latestWeightDate = latestWeightsByAnimal.get(animal.id);
      if (!latestWeightDate) return true;
      const parsed = new Date(latestWeightDate);
      if (Number.isNaN(parsed.getTime())) return true;
      return parsed < threshold;
    }).length;
  }, [filteredAnimals, latestWeightsByAnimal]);

  const healthSummary = useMemo(() => {
    const rows = healthAssessmentsQuery.data ?? [];
    return {
      healthy: rows.filter((item) => item.health_status === "healthy").length,
      watch: rows.filter((item) => item.health_status === "watch").length,
      atRisk: rows.filter((item) => item.health_status === "at_risk").length,
      critical: rows.filter((item) => item.health_status === "critical").length,
    };
  }, [healthAssessmentsQuery.data]);

  const openAlerts = useMemo(
    () =>
      alerts.filter(
        (item) =>
          (item.status === "open" || item.status === "reviewing") &&
          (!item.animal_id || selectedAnimalIds.has(item.animal_id)),
      ),
    [alerts, selectedAnimalIds],
  );
  const criticalAlerts = useMemo(
    () => openAlerts.filter((item) => item.severity === "critical"),
    [openAlerts],
  );
  const lowStockRows = useMemo(
    () =>
      inventoryRows.filter(
        (row) =>
          row.lowStock && (!filters.speciesId || row.feedType.species_id === filters.speciesId),
      ),
    [filters.speciesId, inventoryRows],
  );
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
        .filter((item) => !filters.speciesId || item.speciesId === filters.speciesId)
        .filter((item) => !filters.penId || selectedAnimalIds.has(item.animalId))
        .filter((item) => item.recommendation === "SELL_NOW" || item.recommendation === "WATCH")
        .sort((a, b) => (b.expectedProfit ?? 0) - (a.expectedProfit ?? 0))
        .slice(0, 5),
    [filters.penId, filters.speciesId, predictions, selectedAnimalIds],
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

    if (overdueWeightAnimalsCount > 0) {
      rows.push({
        id: "overdue-weights",
        title: `${overdueWeightAnimalsCount} animal(s) overdue for weight record`,
        detail: "Capture fresh weights for better growth and profit signals.",
        route: "/animals/weights",
        variant: "warning",
      });
    }

    if (healthSummary.critical > 0 || healthSummary.atRisk > 0) {
      rows.push({
        id: "health-risk",
        title: `${healthSummary.critical + healthSummary.atRisk} animal(s) at risk or critical`,
        detail: "Review latest health assessment recommendations.",
        route: "/animals",
        variant: "danger",
      });
    }

    return rows;
  }, [
    criticalAlerts.length,
    healthSummary.atRisk,
    healthSummary.critical,
    lowStockRows.length,
    overdueWeightAnimalsCount,
    unpaidSales.length,
  ]);

  const onRefreshAll = async () => {
    await Promise.all([
      animalsQuery.refetch(),
      alertsQuery.refetch(),
      feedInventoryQuery.refetch(),
      feedCostQuery.refetch(),
      salesAnalyticsQuery.refetch(),
      sellingPredictionsQuery.refetch(),
      penManagementQuery.refetch(),
      healthAssessmentsQuery.refetch(),
      weightsQuery.refetch(),
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

  const onRunHealthScan = async () => {
    try {
      await runHealthAssessments.mutateAsync({ mode: "farm_scan" });
      await healthAssessmentsQuery.refetch();
      toast.success("Health assessments refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run health assessments");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title="Dashboard"
        description="Today’s feedlot performance, growth, and market signals at a glance."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={onRefreshAll}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <DashboardFilterBar
        filters={filters}
        species={speciesQuery.data ?? []}
        pens={pensQuery.data ?? []}
        onFiltersChange={setFilters}
      />

      <DashboardSnapshotCards
        activeAnimalsSummary={activeAnimalsSummary}
        feedCost={feedCostQuery.data}
        predictions={predictions}
      />

      <DashboardHealthSummaryCard
        healthy={healthSummary.healthy}
        watch={healthSummary.watch}
        atRisk={healthSummary.atRisk}
        critical={healthSummary.critical}
        isRunning={runHealthAssessments.isPending}
        onRunAssessment={onRunHealthScan}
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
