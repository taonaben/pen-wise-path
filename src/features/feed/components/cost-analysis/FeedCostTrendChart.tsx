import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FeedCostTrendPoint } from "../../types/feedCostAnalysis.types";
import { formatMoney } from "./format";

type Props = {
  data: FeedCostTrendPoint[];
};

export function FeedCostTrendChart({ data }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">Feed Cost Over Time</div>
        <div className="text-xs text-farm-muted">Daily allocation cost</div>
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#9cb8aa" fontSize={11} tickMargin={8} />
            <YAxis stroke="#9cb8aa" fontSize={11} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value) => formatMoney(Number(value))}
              contentStyle={{
                background: "#062f25",
                border: "1px solid #16483a",
                borderRadius: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="feedCost"
              name="Feed cost"
              stroke="#b7f34a"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
