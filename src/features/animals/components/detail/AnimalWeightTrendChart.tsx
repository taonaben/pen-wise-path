import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightRecord } from "../../types/animal.types";

type Props = {
  records: WeightRecord[];
  title: string;
};

type ChartPoint = {
  dateLabel: string;
  weightKg: number;
};

function formatChartDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AnimalWeightTrendChart({ records, title }: Props) {
  const data = useMemo<ChartPoint[]>(() => {
    return [...records]
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
      .map((record) => ({
        dateLabel: formatChartDate(record.recorded_at),
        weightKg: Number(record.weight_kg),
      }))
      .filter((point) => Number.isFinite(point.weightKg));
  }, [records]);

  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-farm-muted">
          {data.length > 0 ? `${data.length} record${data.length === 1 ? "" : "s"}` : "No records"}
        </div>
      </div>
      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-farm-muted">
          No weight records available yet.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" stroke="#9cb8aa" fontSize={11} />
              <YAxis stroke="#9cb8aa" fontSize={11} unit="kg" />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(2)} kg`, "Weight"]}
                contentStyle={{
                  background: "#062f25",
                  border: "1px solid #16483a",
                  borderRadius: 12,
                }}
              />
              <Line type="monotone" dataKey="weightKg" stroke="#b7f34a" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
