import type { FeedCostStatus } from "../../types/feedCostAnalysis.types";

export function formatMoney(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `$${value.toFixed(2)}${suffix}`;
}

export function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)} kg`;
}

export function formatRatio(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toFixed(2);
}

export function statusClass(status: FeedCostStatus) {
  switch (status) {
    case "Excellent":
      return "bg-emerald-500/20 text-emerald-200";
    case "Normal":
      return "bg-farm-lime/15 text-farm-lime";
    case "Poor":
      return "bg-amber-500/20 text-amber-200";
    case "Critical":
      return "bg-farm-danger/20 text-farm-danger";
    default:
      return "bg-farm-700 text-farm-muted";
  }
}
