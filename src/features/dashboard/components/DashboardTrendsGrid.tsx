import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FeedCostAnalysisResult } from "@/features/feed/types/feedCostAnalysis.types";
import type { SalesAnalyticsResult } from "@/features/market/types/sales.types";

type Props = {
  salesAnalytics: SalesAnalyticsResult;
  feedCost: FeedCostAnalysisResult | undefined;
};

export function DashboardTrendsGrid({ salesAnalytics, feedCost }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-farm-800/80 p-3.5 backdrop-blur-sm sm:p-5">
        <div className="mb-2 text-sm font-medium">Revenue & Profit Trend</div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesAnalytics.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
              <Line type="monotone" dataKey="profit" stroke="#a3e635" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-farm-800/80 p-3.5 backdrop-blur-sm sm:p-5">
        <div className="mb-2 text-sm font-medium">Feed Cost Trend</div>
        <div className="h-52 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={feedCost?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="feedCost"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
