import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";

export const Route = createFileRoute("/_app/reports/feed-cost")({
  component: () => (
    <div>
      <PageHeader title="Feed Cost Report" description="Where feed spending goes and how it trends." />
      <PlaceholderLineChart title="Feed Cost / Month" />
    </div>
  ),
});
