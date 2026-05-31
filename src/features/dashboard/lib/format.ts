export function toCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function toShortDate(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
}

export function getSeverityBadgeClass(severity: string) {
  if (severity === "critical") return "bg-farm-danger/20 text-farm-danger";
  if (severity === "high") return "bg-farm-warning/20 text-farm-warning";
  return "bg-farm-700 text-farm-muted";
}
