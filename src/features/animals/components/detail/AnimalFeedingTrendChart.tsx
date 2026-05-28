import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnimalFeedAllocationViewModel } from "../../types/animal.types";

type Props = {
  allocations: AnimalFeedAllocationViewModel[];
  title: string;
};

type ChartPoint = {
  date: string;
  quantityKg: number;
  cost: number;
};

function formatChartDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AnimalFeedingTrendChart({ allocations, title }: Props) {
  const data = useMemo<ChartPoint[]>(() => {
    const grouped = new Map<string, ChartPoint>();

    for (const allocation of allocations) {
      const dateKey = allocation.date;
      const current = grouped.get(dateKey);
      if (current) {
        current.quantityKg += allocation.allocatedQuantityKg;
        current.cost += allocation.allocatedCost;
      } else {
        grouped.set(dateKey, {
          date: dateKey,
          quantityKg: allocation.allocatedQuantityKg,
          cost: allocation.allocatedCost,
        });
      }
    }

    return [...grouped.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((point) => ({
        ...point,
        date: formatChartDate(point.date),
      }));
  }, [allocations]);

  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-farm-muted">
          {data.length > 0 ? `${data.length} day${data.length === 1 ? "" : "s"}` : "No records"}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-farm-muted">
          No feeding records available yet.
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#16483a" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#9cb8aa" fontSize={11} />
              <YAxis yAxisId="quantity" stroke="#9cb8aa" fontSize={11} unit="kg" />
              <YAxis yAxisId="cost" orientation="right" stroke="#9cb8aa" fontSize={11} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "Cost") return [`$${Number(value).toFixed(2)}`, name];
                  return [`${Number(value).toFixed(2)} kg`, name];
                }}
                contentStyle={{
                  background: "#062f25",
                  border: "1px solid #16483a",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Line
                yAxisId="quantity"
                type="monotone"
                dataKey="quantityKg"
                name="Quantity"
                stroke="#b7f34a"
                strokeWidth={2.5}
                dot
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                name="Cost"
                stroke="#4fd1c5"
                strokeWidth={2.5}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
