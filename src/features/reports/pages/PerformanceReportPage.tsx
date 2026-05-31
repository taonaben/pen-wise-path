import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCcw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { usePens } from "@/features/animals/hooks/usePens";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { formatKg, formatNumber } from "../lib/format";
import { exportCsv, exportPdf } from "../lib/reportExport";
import { getDefaultReportFilters, getRangeForPreset } from "../lib/reportFilters";
import { readReportStateFromUrl, writeReportStateToUrl } from "../lib/reportUrlState";
import { usePerformanceReport } from "../hooks/usePerformanceReport";
import { ReportChartCard } from "../components/ReportChartCard";
import { ReportDataTable } from "../components/ReportDataTable";
import { ReportFilterBar } from "../components/ReportFilterBar";
import { ReportInsightsPanel } from "../components/ReportInsightsPanel";
import { ReportSummaryCards } from "../components/ReportSummaryCards";
import type { ReportDatePreset, ReportSummaryItem } from "../types/report.types";

const pieColors = ["#a3e635", "#38bdf8", "#f59e0b", "#ef4444", "#94a3b8"];

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function PerformanceReportPage() {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const pensQuery = usePens(currentFarm.id);
  const initialState = useMemo(
    () =>
      readReportStateFromUrl({ defaultFilters: getDefaultReportFilters(), defaultPreset: "30" }),
    [],
  );
  const [datePreset, setDatePreset] = useState<ReportDatePreset>(initialState.preset);
  const [filters, setFilters] = useState(initialState.filters);

  const reportQuery = usePerformanceReport(currentFarm.id, filters);
  const report = reportQuery.data;

  useEffect(() => {
    writeReportStateToUrl({ filters, preset: datePreset });
  }, [filters, datePreset]);

  const summaryItems = useMemo<ReportSummaryItem[]>(() => {
    if (!report) return [];

    return [
      {
        id: "active-animals",
        title: "Total Active Animals",
        value: formatNumber(report.summary.totalActiveAnimals, 0),
        description: "Animals currently in active cycle",
      },
      {
        id: "avg-adg",
        title: "Average Daily Gain",
        value: `${formatNumber(report.summary.averageDailyGainKgPerDay, 3)} kg/day`,
        description: "Across filtered animals",
      },
      {
        id: "avg-weight",
        title: "Average Current Weight",
        value: formatKg(report.summary.averageCurrentWeightKg),
        description: "Latest captured weight",
      },
      {
        id: "total-gain",
        title: "Total Weight Gained",
        value: formatKg(report.summary.totalWeightGainedKg),
        description: `${report.summary.negativeGainAnimals} animals with negative gain`,
        variant: report.summary.negativeGainAnimals > 0 ? "warning" : "default",
      },
      {
        id: "underperforming",
        title: "Underperforming Animals",
        value: formatNumber(report.summary.underperformingAnimals, 0),
        description: "Critical or below expected ADG",
        variant: report.summary.underperformingAnimals > 0 ? "warning" : "success",
      },
      {
        id: "ready-for-sale",
        title: "Animals Ready For Sale",
        value: formatNumber(report.summary.readyForSaleAnimals, 0),
        description: "Based on species weight targets",
      },
    ];
  }, [report]);

  const onPresetChange = (preset: ReportDatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    setFilters((current) => ({ ...current, ...getRangeForPreset(preset) }));
  };

  const exportCurrentCsv = () => {
    if (!report) return;

    exportCsv({
      fileName: `performance-report-${todayStamp()}`,
      rows: report.animalRows,
      columns: [
        { header: "Animal", value: (row) => row.tagNumber },
        { header: "Species", value: (row) => row.speciesName },
        { header: "Pen", value: (row) => row.penName },
        { header: "Start Weight Kg", value: (row) => row.startWeightKg },
        { header: "Current Weight Kg", value: (row) => row.currentWeightKg },
        { header: "Total Gain Kg", value: (row) => row.totalGainKg },
        { header: "ADG Kg/Day", value: (row) => row.adgKgPerDay },
        { header: "Expected ADG", value: (row) => row.expectedAdgKgPerDay },
        { header: "Health Status", value: (row) => row.healthStatus },
        { header: "Growth Status", value: (row) => row.growthStatus },
        { header: "Recommendation", value: (row) => row.recommendation },
      ],
    });
  };

  const exportCurrentPdf = async () => {
    if (!report) return;

    await exportPdf({
      fileName: `performance-report-${todayStamp()}`,
      title: "Performance Report",
      subtitle: `${filters.startDate} to ${filters.endDate} | Farm: ${currentFarm.name}`,
      lines: [
        `Total active animals: ${report.summary.totalActiveAnimals}`,
        `Average daily gain: ${formatNumber(report.summary.averageDailyGainKgPerDay, 3)} kg/day`,
        `Average current weight: ${formatKg(report.summary.averageCurrentWeightKg)}`,
        `Total weight gained: ${formatKg(report.summary.totalWeightGainedKg)}`,
        `Underperforming animals: ${report.summary.underperformingAnimals}`,
        `Negative gain animals: ${report.summary.negativeGainAnimals}`,
        `Ready for sale: ${report.summary.readyForSaleAnimals}`,
        "",
        "Top performers:",
        ...report.topPerformers.map(
          (item, index) =>
            `${index + 1}. ${item.tagNumber} (${item.speciesName}) - ADG ${formatNumber(item.adgKgPerDay, 3)} kg/day`,
        ),
      ],
    });
  };

  const handleExportCsv = () => {
    try {
      exportCurrentCsv();
      toast.success("Performance CSV exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV export failed");
    }
  };

  const handleExportPdf = async () => {
    try {
      await exportCurrentPdf();
      toast.success("Performance PDF exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PDF export failed");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Performance Report"
        description="Track animal growth, health, and production performance."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => reportQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" onClick={handleExportPdf} disabled={!report}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button type="button" variant="outline" onClick={handleExportCsv} disabled={!report}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <ReportFilterBar
        filters={filters}
        datePreset={datePreset}
        options={{
          species: speciesQuery.data ?? [],
          pens: pensQuery.data ?? [],
        }}
        onPresetChange={onPresetChange}
        onFiltersChange={setFilters}
      />

      {reportQuery.isLoading ? (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading performance report...
        </div>
      ) : null}

      {reportQuery.isError ? (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load the performance report.
        </div>
      ) : null}

      {report && report.animalRows.length === 0 ? (
        <EmptyState
          title="No performance data"
          description="No animals matched the selected filters for this period."
        />
      ) : null}

      {report ? (
        <>
          <ReportSummaryCards items={summaryItems} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ReportChartCard
              title="Average Daily Gain Over Time"
              description="Average ADG trend based on recorded weights."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.adgTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="averageAdgKgPerDay"
                      stroke="#a3e635"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ReportChartCard>

            <ReportChartCard
              title="Weight Gain By Species"
              description="Total weight gained by species in the selected period."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.gainBySpecies}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ReportChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ReportChartCard
              title="Top Performing Animals"
              description="Animals with the highest average daily gain."
            >
              <div className="space-y-2">
                {report.topPerformers.map((row, index) => (
                  <div key={row.animalId} className="rounded-lg bg-farm-900/60 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {index + 1}. {row.tagNumber} ({row.speciesName})
                      </span>
                      <span className="text-farm-lime">
                        {formatNumber(row.adgKgPerDay, 3)} kg/day
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ReportChartCard>

            <ReportChartCard
              title="Performance Category Breakdown"
              description="Distribution across critical, underperforming, normal, and excellent classes."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.performanceCategories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={110}
                      label
                    >
                      {report.performanceCategories.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ReportChartCard>
          </div>

          <ReportInsightsPanel insights={report.insights} />

          <ReportDataTable
            title="Animal Performance Table"
            description="Growth and health context for each animal in the selected scope."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Pen</TableHead>
                  <TableHead>Start Weight</TableHead>
                  <TableHead>Current Weight</TableHead>
                  <TableHead>Total Gain</TableHead>
                  <TableHead>ADG</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Growth Status</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.animalRows.map((row) => (
                  <TableRow key={row.animalId}>
                    <TableCell className="font-medium">{row.tagNumber}</TableCell>
                    <TableCell>{row.speciesName}</TableCell>
                    <TableCell>{row.penName}</TableCell>
                    <TableCell>{formatKg(row.startWeightKg)}</TableCell>
                    <TableCell>{formatKg(row.currentWeightKg)}</TableCell>
                    <TableCell>{formatKg(row.totalGainKg)}</TableCell>
                    <TableCell>{formatNumber(row.adgKgPerDay, 3)}</TableCell>
                    <TableCell>{row.healthStatus}</TableCell>
                    <TableCell>{row.growthStatus}</TableCell>
                    <TableCell>{row.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportDataTable>

          <ReportDataTable
            title="Underperforming Animals"
            description="Animals below expected ADG or showing critical growth issues."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>ADG</TableHead>
                  <TableHead>Expected ADG</TableHead>
                  <TableHead>Active Alerts</TableHead>
                  <TableHead>Health Status</TableHead>
                  <TableHead>Suggested Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.underperformingRows.map((row) => (
                  <TableRow key={`risk-${row.animalId}`}>
                    <TableCell className="font-medium">{row.tagNumber}</TableCell>
                    <TableCell>{row.speciesName}</TableCell>
                    <TableCell>{formatNumber(row.adgKgPerDay, 3)}</TableCell>
                    <TableCell>{formatNumber(row.expectedAdgKgPerDay, 3)}</TableCell>
                    <TableCell>{row.activeAlerts}</TableCell>
                    <TableCell>{row.healthStatus}</TableCell>
                    <TableCell>{row.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportDataTable>
        </>
      ) : null}
    </div>
  );
}
