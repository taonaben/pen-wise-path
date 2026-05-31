import type { ReportDatePreset, ReportFilters } from "../types/report.types";

const allowedPresets: ReportDatePreset[] = ["7", "30", "90", "month", "custom"];

function isIsoDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function readReportStateFromUrl(args: {
  defaultFilters: ReportFilters;
  defaultPreset: ReportDatePreset;
}): { filters: ReportFilters; preset: ReportDatePreset } {
  if (typeof window === "undefined") {
    return {
      filters: args.defaultFilters,
      preset: args.defaultPreset,
    };
  }

  const params = new URLSearchParams(window.location.search);

  const presetParam = params.get("preset");
  const preset = allowedPresets.includes(presetParam as ReportDatePreset)
    ? (presetParam as ReportDatePreset)
    : args.defaultPreset;

  const speciesId = params.get("species") || undefined;
  const penId = params.get("pen") || undefined;
  const status = params.get("status");

  const filters: ReportFilters = {
    startDate: isIsoDate(params.get("start"))
      ? (params.get("start") as string)
      : args.defaultFilters.startDate,
    endDate: isIsoDate(params.get("end"))
      ? (params.get("end") as string)
      : args.defaultFilters.endDate,
    speciesId,
    penId,
    animalStatus:
      status && ["all", "active", "sold", "sick", "removed", "dead"].includes(status)
        ? (status as ReportFilters["animalStatus"])
        : args.defaultFilters.animalStatus,
  };

  return { filters, preset };
}

export function writeReportStateToUrl(args: { filters: ReportFilters; preset: ReportDatePreset }) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  params.set("start", args.filters.startDate);
  params.set("end", args.filters.endDate);
  params.set("status", args.filters.animalStatus);
  params.set("preset", args.preset);

  if (args.filters.speciesId) params.set("species", args.filters.speciesId);
  else params.delete("species");

  if (args.filters.penId) params.set("pen", args.filters.penId);
  else params.delete("pen");

  const nextSearch = params.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}
