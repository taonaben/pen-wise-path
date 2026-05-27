import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const data = [
  { k: "Angus", v: 1.1 },
  { k: "Brahman", v: 1.3 },
  { k: "Mashona", v: 0.6 },
  { k: "Hereford", v: 0.4 },
  { k: "Boran", v: 0.95 },
];

export function PlaceholderBarChart({ title = "ADG by Breed (kg/day)" }: { title?: string }) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5">
      <div className="mb-3 text-sm font-medium text-foreground">{title}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
            <XAxis dataKey="k" stroke="#9cb8aa" fontSize={11} />
            <YAxis stroke="#9cb8aa" fontSize={11} />
            <Tooltip contentStyle={{ background: "#062f25", border: "1px solid #16483a", borderRadius: 12 }} />
            <Bar dataKey="v" fill="#b7f34a" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
