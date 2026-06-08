import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = Array.from({ length: 12 }).map((_, i) => ({
  d: `W${i + 1}`,
  v: 320 + Math.round(Math.sin(i / 2) * 18 + i * 6),
}));

export function PlaceholderLineChart({ title = "Weight Gain Trend" }: { title?: string }) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-farm-muted">Last 12 weeks</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
            <XAxis dataKey="d" stroke="#9cb8aa" fontSize={11} />
            <YAxis stroke="#9cb8aa" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#062f25",
                border: "1px solid #16483a",
                borderRadius: 12,
              }}
            />
            <Line type="monotone" dataKey="v" stroke="#b7f34a" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
