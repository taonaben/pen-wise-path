import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PlaceholderDonutChart } from "@/shared/components/charts/PlaceholderDonutChart";
import { PlaceholderBarChart } from "@/shared/components/charts/PlaceholderBarChart";

export const Route = createFileRoute("/_app/reports/profitability")({
  component: () => (
    <div>
      <PageHeader title="Profitability Report" description="Per-animal margin and ROI across cohorts." />
      <div className="grid lg:grid-cols-2 gap-4">
        <PlaceholderBarChart title="Margin per Animal ($)" />
        <PlaceholderDonutChart title="Profit Mix by Breed" />
      </div>
    </div>
  ),
});
