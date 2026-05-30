import type { PaymentStatus, PredictionAccuracy, SaleStatus } from "../types/sales.types";

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  const amount = value ?? 0;
  return `${currency === "USD" ? "$" : currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)}%`;
}

export function formatSaleStatus(status: SaleStatus) {
  const labels: Record<SaleStatus, string> = {
    completed: "Completed",
    voided: "Voided",
    pending_payment: "Pending payment",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

export function formatPaymentStatus(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    paid: "Paid",
    partially_paid: "Partially paid",
    unpaid: "Unpaid",
  };
  return labels[status] ?? status;
}

export function formatPredictionAccuracy(value: PredictionAccuracy) {
  const labels: Record<PredictionAccuracy, string> = {
    accurate: "Accurate",
    close: "Close",
    overestimated: "Overestimated",
    underestimated: "Underestimated",
    not_linked: "Not linked",
  };
  return labels[value] ?? value;
}
