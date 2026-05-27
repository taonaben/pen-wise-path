import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Excellent", value: 12, color: "#b7f34a" },
  { name: "Normal", value: 24, color: "#22c55e" },
  { name: "Underperforming", value: 7, color: "#f97316" },
  { name: "Critical", value: 3, color: "#ef4444" },
];

export function PlaceholderDonutChart({ title = "Animal Performance" }: { title?: string }) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5">
      <div className="mb-3 text-sm font-medium text-foreground">{title}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#062f25", border: "1px solid #16483a", borderRadius: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
