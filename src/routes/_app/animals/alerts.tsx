import { createFileRoute } from "@tanstack/react-router";
import { GrowthAlertsPage } from "@/features/animals/pages/GrowthAlertsPage";

export const Route = createFileRoute("/_app/animals/alerts")({
  component: GrowthAlertsPage,
});
