import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PlaceholderBarChart } from "@/shared/components/charts/PlaceholderBarChart";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";

export const Route = createFileRoute("/_app/feed/analysis")({
  component: () => (
    <div>
      <PageHeader title="Feed Cost Analysis" description="Where the money goes and how efficient each feed type is." />
      <div className="grid lg:grid-cols-2 gap-4">
        <PlaceholderLineChart title="Feed Cost Over Time" />
        <PlaceholderBarChart title="Cost per kg gain by Feed" />
      </div>
    </div>
  ),
});
