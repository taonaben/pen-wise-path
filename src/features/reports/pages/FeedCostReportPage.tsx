import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { usePens } from "@/features/animals/hooks/usePens";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { AnimalFeedCostTable } from "@/features/feed/components/cost-analysis/AnimalFeedCostTable";
import {
  FeedCostByFeedTypeChart,
  FeedCostByPenChart,
  FeedCostBySpeciesChart,
} from "@/features/feed/components/cost-analysis/FeedCostBreakdownCharts";
import { FeedCostInsights } from "@/features/feed/components/cost-analysis/FeedCostInsights";
import { FeedCostSummaryCards } from "@/features/feed/components/cost-analysis/FeedCostSummaryCards";
import { FeedCostTrendChart } from "@/features/feed/components/cost-analysis/FeedCostTrendChart";
import { FeedEfficiencyTable } from "@/features/feed/components/cost-analysis/FeedEfficiencyTable";
import { PenFeedCostTable } from "@/features/feed/components/cost-analysis/PenFeedCostTable";
import {
  getDefaultFeedCostAnalysisFilters,
  useFeedCostAnalysis,
} from "@/features/feed/hooks/useFeedCostAnalysis";
import type { FeedCostAnalysisFilters } from "@/features/feed/types/feedCostAnalysis.types";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { exportCsv, exportPdf } from "../lib/reportExport";
import { getRangeForPreset } from "../lib/reportFilters";
import { readReportStateFromUrl, writeReportStateToUrl } from "../lib/reportUrlState";
import { ReportFilterBar } from "../components/ReportFilterBar";
import type { ReportDatePreset, ReportFilters } from "../types/report.types";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function FeedCostReportPage() {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const pensQuery = usePens(currentFarm.id);

  const initialReportState = useMemo(
    () =>
      readReportStateFromUrl({
        defaultFilters: {
          ...getDefaultFeedCostAnalysisFilters(),
          animalStatus: "all",
        },
        defaultPreset: "30",
      }),
    [],
  );
  const [datePreset, setDatePreset] = useState<ReportDatePreset>(initialReportState.preset);
  const [filters, setFilters] = useState<FeedCostAnalysisFilters>({
    ...getDefaultFeedCostAnalysisFilters(),
    ...initialReportState.filters,
    animalStatus: initialReportState.filters.animalStatus,
  });

  const analysisQuery = useFeedCostAnalysis(currentFarm.id, filters);
  const analysis = analysisQuery.data;

  const reportFilters = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      speciesId: filters.speciesId,
      penId: filters.penId,
      animalStatus: filters.animalStatus ?? "all",
    }),
    [filters],
  );

  useEffect(() => {
    writeReportStateToUrl({ filters: reportFilters, preset: datePreset });
  }, [reportFilters, datePreset]);

  const onPresetChange = (preset: ReportDatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;

    const range = getRangeForPreset(preset);
    setFilters((current) => ({ ...current, ...range }));
  };

  const onFiltersChange = (next: ReportFilters) => {
    setFilters((current) => ({
      ...current,
      startDate: next.startDate,
      endDate: next.endDate,
      speciesId: next.speciesId,
      penId: next.penId,
      animalStatus: next.animalStatus,
    }));
  };

  const handleExportCsv = () => {
    if (!analysis) return;

    exportCsv({
      fileName: `feed-cost-report-${todayStamp()}`,
      rows: analysis.animalRows,
      columns: [
        { header: "Animal", value: (row) => row.tagNumber },
        { header: "Species", value: (row) => row.speciesName },
        { header: "Pen", value: (row) => row.penName },
        { header: "Feed Consumed Kg", value: (row) => row.feedConsumedKg },
        { header: "Feed Cost", value: (row) => row.feedCost },
        { header: "Weight Gained Kg", value: (row) => row.weightGainedKg },
        { header: "FCR", value: (row) => row.fcr },
        { header: "Cost/Kg Gained", value: (row) => row.costPerKgGained },
        { header: "Status", value: (row) => row.status },
      ],
    });

    toast.success("Feed cost CSV exported");
  };

  const handleExportPdf = async () => {
    if (!analysis) return;

    await exportPdf({
      fileName: `feed-cost-report-${todayStamp()}`,
      title: "Feed Cost Report",
      subtitle: `${filters.startDate} to ${filters.endDate} | Farm: ${currentFarm.name}`,
      lines: [
        `Total feed cost: ${analysis.summary.totalFeedCost.toFixed(2)}`,
        `Total feed used: ${analysis.summary.totalFeedUsedKg.toFixed(2)} kg`,
        `Average cost/kg gained: ${analysis.summary.averageCostPerKgGained?.toFixed(2) ?? "-"}`,
        `Average FCR: ${analysis.summary.averageFcr?.toFixed(2) ?? "-"}`,
        `Most expensive feed: ${analysis.summary.mostExpensiveFeed ?? "-"}`,
        `Worst performing pen: ${analysis.summary.worstPerformingPen ?? "-"}`,
      ],
    });

    toast.success("Feed cost PDF exported");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feed Cost Report"
        description="Where feed spending goes, and how efficiently it converts into animal gain."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => analysisQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={handleExportPdf} disabled={!analysis}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button type="button" variant="outline" onClick={handleExportCsv} disabled={!analysis}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <ReportFilterBar
        filters={reportFilters}
        datePreset={datePreset}
        options={{ species: speciesQuery.data ?? [], pens: pensQuery.data ?? [] }}
        onPresetChange={onPresetChange}
        onFiltersChange={onFiltersChange}
      />

      {analysisQuery.isLoading ? (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading feed cost report...
        </div>
      ) : null}

      {analysisQuery.isError ? (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load feed cost report.
        </div>
      ) : null}

      {analysis && analysis.animalRows.length === 0 ? (
        <EmptyState
          title="No feed cost data"
          description="No feed records matched the selected filters."
        />
      ) : null}

      {analysis ? (
        <>
          <FeedCostSummaryCards summary={analysis.summary} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FeedCostTrendChart data={analysis.trend} />
            <FeedCostByFeedTypeChart data={analysis.costByFeedType} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FeedCostBySpeciesChart data={analysis.costBySpecies} />
            <FeedCostByPenChart data={analysis.costByPen} />
          </div>

          <FeedCostInsights insights={analysis.insights} />
          <FeedEfficiencyTable rows={analysis.feedEfficiencyRows} />
          <AnimalFeedCostTable rows={analysis.animalRows} />
          <PenFeedCostTable rows={analysis.penRows} />
        </>
      ) : null}
    </div>
  );
}
