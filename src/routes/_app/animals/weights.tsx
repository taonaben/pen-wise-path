import { createFileRoute } from "@tanstack/react-router";
import { WeightRecordsPage } from "@/features/animals/pages/WeightRecordsPage";

export const Route = createFileRoute("/_app/animals/weights")({
  component: WeightRecordsPage,
});
