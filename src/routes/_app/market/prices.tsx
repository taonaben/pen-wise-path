import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";

export const Route = createFileRoute("/_app/market/prices")({
  component: () => (
    <div>
      <PageHeader title="Market Prices" description="Track price per kilogram over time and from different sources." />
      <PlaceholderLineChart title="Market Price (USD / kg)" />
    </div>
  ),
});
