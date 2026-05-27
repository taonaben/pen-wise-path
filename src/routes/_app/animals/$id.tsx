import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";

export const Route = createFileRoute("/_app/animals/$id")({
  component: AnimalDetailPage,
});

function AnimalDetailPage() {
  const { id } = Route.useParams();
  return (
    <div>
      <Link to="/animals" className="inline-flex items-center gap-1.5 text-sm text-farm-muted hover:text-farm-lime mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to animals
      </Link>
      <PageHeader title={`Animal TAG-${id}`} description="Detailed weight history, feed events, and projected sale window." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Current Weight" value="385 kg" />
        <StatCard title="ADG (14d)" value="0.92 kg/d" variant="success" trend="+4%" />
        <StatCard title="Total Feed Cost" value="$142" />
      </div>

      <div className="mt-6">
        <PlaceholderLineChart title="Weight Over Time" />
      </div>
    </div>
  );
}
