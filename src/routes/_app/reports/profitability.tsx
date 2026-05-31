import { createFileRoute } from "@tanstack/react-router";
import { ProfitabilityReportPage } from "@/features/reports/pages/ProfitabilityReportPage";

export const Route = createFileRoute("/_app/reports/profitability")({
  component: ProfitabilityReportPage,
});
