import type { PriceBasis } from "../types/market.types";

export function formatMoney(value: number | null | undefined, currency = "USD", suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${currency} ${value.toFixed(2)}${suffix}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatBasis(value: PriceBasis) {
  return value.replaceAll("_", " ");
}

export function formatWeightRange(min: number | null, max: number | null) {
  if (min === null && max === null) return "-";
  if (min !== null && max !== null) return `${min.toFixed(0)}-${max.toFixed(0)}kg`;
  if (min !== null) return `${min.toFixed(0)}kg+`;
  return `up to ${max?.toFixed(0)}kg`;
}
