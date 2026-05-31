import type { ReportDatePreset, ReportFilters } from "../types/report.types";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDefaultReportFilters(): ReportFilters {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
    animalStatus: "all",
  };
}

export function getRangeForPreset(
  preset: ReportDatePreset,
): Pick<ReportFilters, "startDate" | "endDate"> {
  const end = new Date();
  const start = new Date();

  if (preset === "7") start.setDate(end.getDate() - 6);
  if (preset === "30") start.setDate(end.getDate() - 29);
  if (preset === "90") start.setDate(end.getDate() - 89);
  if (preset === "month") start.setDate(1);

  return {
    startDate: isoDate(start),
    endDate: isoDate(end),
  };
}
