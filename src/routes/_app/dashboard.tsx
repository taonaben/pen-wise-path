import { createFileRoute } from "@tanstack/react-router";
import { Beef, TrendingUp, Wallet, AlertTriangle, DollarSign, Target } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";
import { PlaceholderBarChart } from "@/shared/components/charts/PlaceholderBarChart";
import { PlaceholderDonutChart } from "@/shared/components/charts/PlaceholderDonutChart";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today’s feedlot performance, growth, and market signals at a glance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Animals" value="46" description="active in feedlot" icon={<Beef className="h-4 w-4" />} />
        <StatCard title="Average Daily Gain" value="0.92 kg" trend="+4.2%" description="vs last week" variant="success" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Total Feed Cost" value="$1,284" trend="+1.8%" description="last 30 days" icon={<Wallet className="h-4 w-4" />} />
        <StatCard title="Underperforming" value="7" description="need inspection" variant="warning" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard title="Projected Revenue" value="$24,650" description="next 60 days" variant="success" icon={<DollarSign className="h-4 w-4" />} />
        <StatCard title="Recommended Sales" value="9" description="within optimal window" icon={<Target className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlaceholderLineChart title="Weight Gain Trend" />
        <PlaceholderLineChart title="Feed Cost Trend" />
        <PlaceholderBarChart title="ADG by Breed (kg/day)" />
        <PlaceholderDonutChart title="Animal Performance Breakdown" />
      </div>
    </div>
  );
}
