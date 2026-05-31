import { createFileRoute } from "@tanstack/react-router";
import { FeedCostReportPage } from "@/features/reports/pages/FeedCostReportPage";

export const Route = createFileRoute("/_app/reports/feed-cost")({
  component: FeedCostReportPage,
});
