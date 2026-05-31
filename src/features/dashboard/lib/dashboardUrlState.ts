import type { DashboardFilters } from "../types";

function isIsoDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function readDashboardStateFromUrl(defaultFilters: DashboardFilters): DashboardFilters {
  if (typeof window === "undefined") return defaultFilters;

  const params = new URLSearchParams(window.location.search);

  return {
    startDate: isIsoDate(params.get("d-start"))
      ? (params.get("d-start") as string)
      : defaultFilters.startDate,
    endDate: isIsoDate(params.get("d-end"))
      ? (params.get("d-end") as string)
      : defaultFilters.endDate,
    speciesId: params.get("d-species") || undefined,
    penId: params.get("d-pen") || undefined,
  };
}

export function writeDashboardStateToUrl(filters: DashboardFilters) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  params.set("d-start", filters.startDate);
  params.set("d-end", filters.endDate);

  if (filters.speciesId) params.set("d-species", filters.speciesId);
  else params.delete("d-species");

  if (filters.penId) params.set("d-pen", filters.penId);
  else params.delete("d-pen");

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}
