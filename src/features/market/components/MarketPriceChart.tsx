import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketTrendPoint } from "../types/market.types";
import { formatMoney } from "./marketUiFormat";

type Props = {
  title: string;
  currency: string;
  data: MarketTrendPoint[];
};

export function MarketPriceChart({ title, currency, data }: Props) {
  return (
    <div className="rounded-xl border bg-farm-800/80 p-5">
      <div className="mb-3">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-farm-muted">Weekly average price per kg</div>
      </div>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
            <XAxis dataKey="week" stroke="#9cb8aa" fontSize={11} tickMargin={8} />
            <YAxis
              stroke="#9cb8aa"
              fontSize={11}
              tickFormatter={(value) => `${currency} ${value}`}
            />
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency, "/kg")}
              contentStyle={{
                background: "#062f25",
                border: "1px solid #16483a",
                borderRadius: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="averagePrice"
              name="Average price"
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
