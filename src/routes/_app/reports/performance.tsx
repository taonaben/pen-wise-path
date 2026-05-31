import { createFileRoute } from "@tanstack/react-router";
import { PerformanceReportPage } from "@/features/reports/pages/PerformanceReportPage";

export const Route = createFileRoute("/_app/reports/performance")({
  component: PerformanceReportPage,
});
