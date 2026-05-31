import { useMemo, useState } from "react";
import { Download, FileText, RefreshCcw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { formatMoney, formatPercent } from "../lib/format";
import { exportCsv, exportPdf } from "../lib/reportExport";
import { getDefaultReportFilters, getRangeForPreset } from "../lib/reportFilters";
import { useProfitabilityReport } from "../hooks/useProfitabilityReport";
import { ReportChartCard } from "../components/ReportChartCard";
import { ReportDataTable } from "../components/ReportDataTable";
import { ReportFilterBar } from "../components/ReportFilterBar";
import { ReportInsightsPanel } from "../components/ReportInsightsPanel";
import { ReportSummaryCards } from "../components/ReportSummaryCards";
import type { ReportDatePreset, ReportSummaryItem } from "../types/report.types";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function ProfitabilityReportPage() {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const pensQuery = usePens(currentFarm.id);

  const [datePreset, setDatePreset] = useState<ReportDatePreset>("30");
  const [filters, setFilters] = useState(getDefaultReportFilters);

  const reportQuery = useProfitabilityReport(currentFarm.id, filters);
  const report = reportQuery.data;

  const summaryItems = useMemo<ReportSummaryItem[]>(() => {
    if (!report) return [];

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: formatMoney(report.summary.totalRevenue),
        description: "Normalized sale basis",
      },
      {
        id: "profit",
        title: "Total Profit",
        value: formatMoney(report.summary.totalProfit),
        description: "Revenue minus purchase/feed/other costs",
        variant: report.summary.totalProfit >= 0 ? "success" : "danger",
      },
      {
        id: "avg-profit",
        title: "Average Profit Per Animal",
        value: formatMoney(report.summary.averageProfitPerAnimal),
        description: "Completed sales in range",
      },
      {
        id: "avg-margin",
        title: "Average Profit Margin",
        value: formatPercent(report.summary.averageProfitMargin),
        description: "Portfolio-level margin",
      },
      {
        id: "unsold-projected",
        title: "Unsold Projected Profit",
        value: formatMoney(report.summary.unsoldProjectedProfit),
        description: "From latest prediction records",
      },
      {
        id: "prediction-accuracy",
        title: "Prediction Accuracy",
        value: formatPercent(report.summary.predictionAccuracyRate),
        description: "Accurate or close outcomes",
      },
    ];
  }, [report]);

  const onPresetChange = (preset: ReportDatePreset) => {
    setDatePreset(preset);
    if (preset === "custom") return;
    setFilters((current) => ({ ...current, ...getRangeForPreset(preset) }));
  };

  const handleExportCsv = () => {
    if (!report) return;

    exportCsv({
      fileName: `profitability-report-${todayStamp()}`,
      rows: report.soldRows,
      columns: [
        { header: "Animal", value: (row) => row.tagNumber },
        { header: "Species", value: (row) => row.speciesName },
        { header: "Sale Date", value: (row) => row.soldAt },
        { header: "Sale Weight", value: (row) => row.saleWeightKg },
        { header: "Revenue", value: (row) => row.revenue },
        { header: "Purchase Cost", value: (row) => row.purchaseCost },
        { header: "Feed Cost", value: (row) => row.feedCost },
        { header: "Other Cost", value: (row) => row.otherCost },
        { header: "Net Profit", value: (row) => row.netProfit },
        { header: "Margin", value: (row) => row.margin },
        { header: "Normalization", value: (row) => row.normalizedBasis },
      ],
    });

    toast.success("Profitability CSV exported");
  };

  const handleExportPdf = async () => {
    if (!report) return;

    await exportPdf({
      fileName: `profitability-report-${todayStamp()}`,
      title: "Profitability Report",
      subtitle: `${filters.startDate} to ${filters.endDate} | Farm: ${currentFarm.name}`,
      lines: [
        `Total revenue: ${formatMoney(report.summary.totalRevenue)}`,
        `Total profit: ${formatMoney(report.summary.totalProfit)}`,
        `Average profit per animal: ${formatMoney(report.summary.averageProfitPerAnimal)}`,
        `Average margin: ${formatPercent(report.summary.averageProfitMargin)}`,
        `Unsold projected profit: ${formatMoney(report.summary.unsoldProjectedProfit)}`,
        `Prediction accuracy: ${formatPercent(report.summary.predictionAccuracyRate)}`,
      ],
    });

    toast.success("Profitability PDF exported");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profitability Report"
        description="Are we making money after costs, and how accurate are the selling predictions?"
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
        options={{ species: speciesQuery.data ?? [], pens: pensQuery.data ?? [] }}
        onPresetChange={onPresetChange}
        onFiltersChange={setFilters}
      />

      {reportQuery.isLoading ? (
        <div className="rounded-xl border bg-farm-800/80 p-5 text-sm text-farm-muted">
          Loading profitability report...
        </div>
      ) : null}

      {reportQuery.isError ? (
        <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-5 text-sm text-farm-danger">
          Could not load profitability report.
        </div>
      ) : null}

      {report && report.soldRows.length === 0 ? (
        <EmptyState
          title="No sales data"
          description="No completed sales matched the selected filters."
        />
      ) : null}

      {report ? (
        <>
          <ReportSummaryCards items={summaryItems} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ReportChartCard
              title="Revenue And Profit Over Time"
              description="Monthly revenue and profit trend."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#a3e635" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#38bdf8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ReportChartCard>

            <ReportChartCard
              title="Profit By Species"
              description="Net profit contribution by species."
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.profitBySpecies}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip formatter={(value) => formatMoney(Number(value))} />
                    <Bar dataKey="value" fill="#a3e635" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ReportChartCard>
          </div>

          <ReportInsightsPanel insights={report.insights} />

          <ReportDataTable
            title="Sold Animal Profit Table"
            description="Per-animal profitability for completed sales in the selected period."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Sale Weight</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Purchase Cost</TableHead>
                  <TableHead>Feed Cost</TableHead>
                  <TableHead>Other Cost</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.soldRows.map((row) => (
                  <TableRow key={row.saleId}>
                    <TableCell className="font-medium">{row.tagNumber}</TableCell>
                    <TableCell>{row.speciesName}</TableCell>
                    <TableCell>{row.soldAt}</TableCell>
                    <TableCell>{row.saleWeightKg.toFixed(2)} kg</TableCell>
                    <TableCell>{formatMoney(row.revenue)}</TableCell>
                    <TableCell>{formatMoney(row.purchaseCost)}</TableCell>
                    <TableCell>{formatMoney(row.feedCost)}</TableCell>
                    <TableCell>{formatMoney(row.otherCost)}</TableCell>
                    <TableCell>{formatMoney(row.netProfit)}</TableCell>
                    <TableCell>{formatPercent(row.margin)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportDataTable>

          <ReportDataTable
            title="Prediction Accuracy Table"
            description="Predicted selling window and profit versus actual outcomes."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Predicted Sell Window</TableHead>
                  <TableHead>Actual Sale Date</TableHead>
                  <TableHead>Predicted Profit</TableHead>
                  <TableHead>Actual Profit</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Accuracy Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.predictionRows.map((row) => (
                  <TableRow key={`prediction-${row.saleId}`}>
                    <TableCell className="font-medium">{row.tagNumber}</TableCell>
                    <TableCell>{row.predictedSellWindow}</TableCell>
                    <TableCell>{row.actualSaleDate}</TableCell>
                    <TableCell>{formatMoney(row.predictedProfit)}</TableCell>
                    <TableCell>{formatMoney(row.actualProfit)}</TableCell>
                    <TableCell>{formatMoney(row.difference)}</TableCell>
                    <TableCell>{row.accuracyStatus}</TableCell>
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
