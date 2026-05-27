import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PlaceholderBarChart } from "@/shared/components/charts/PlaceholderBarChart";

export const Route = createFileRoute("/_app/reports/performance")({
  component: () => (
    <div>
      <PageHeader title="Performance Report" description="ADG and weight gain efficiency across breeds and cohorts." />
      <PlaceholderBarChart title="ADG by Breed" />
    </div>
  ),
});
