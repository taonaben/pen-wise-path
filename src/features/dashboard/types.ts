import type { SalesFilters } from "@/features/market/types/sales.types";

export type DashboardActionItem = {
  id: string;
  title: string;
  detail: string;
  route: string;
  variant: "warning" | "danger";
};

export type PenUtilizationItem = {
  id: string;
  name: string;
  occupancy: number;
  capacity: number;
  utilization: number;
};

export function getLast30DaySalesFilters(): SalesFilters {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - 29);

  return {
    dateFrom: dateFrom.toISOString().slice(0, 10),
    dateTo: dateTo.toISOString().slice(0, 10),
    saleStatus: "all",
    paymentStatus: "all",
    profitStatus: "all",
  };
}
