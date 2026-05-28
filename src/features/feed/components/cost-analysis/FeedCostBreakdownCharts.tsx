import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FeedCostBreakdownPoint } from "../../types/feedCostAnalysis.types";
import { formatMoney } from "./format";

type ChartProps = {
  title: string;
  description: string;
  data: FeedCostBreakdownPoint[];
};

function BreakdownChart({ title, description, data }: ChartProps) {
  return (
    <div className="rounded-xl border bg-farm-800/80 p-5">
      <div className="mb-3">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-farm-muted">{description}</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data.slice(0, 8)} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#9cb8aa" fontSize={11} tickMargin={8} />
            <YAxis stroke="#9cb8aa" fontSize={11} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{ background: "#062f25", border: "1px solid #16483a", borderRadius: 12 }}
            />
            <Bar dataKey="feedCost" name="Feed cost" fill="#b7f34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FeedCostByFeedTypeChart({ data }: { data: FeedCostBreakdownPoint[] }) {
  return (
    <BreakdownChart
      title="Cost by Feed Type"
      description="Allocated feed cost by ration or feed"
      data={data}
    />
  );
}

export function FeedCostBySpeciesChart({ data }: { data: FeedCostBreakdownPoint[] }) {
  return (
    <BreakdownChart
      title="Cost by Species"
      description="Feed spend across cattle, pigs, goats, and other species"
      data={data}
    />
  );
}

export function FeedCostByPenChart({ data }: { data: FeedCostBreakdownPoint[] }) {
  return (
    <BreakdownChart
      title="Cost by Pen"
      description="Where feed money is being consumed"
      data={data}
    />
  );
}
