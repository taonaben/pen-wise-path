import { differenceInCalendarDays, parseISO } from "date-fns";
import { getSpeciesConfig } from "@/features/animals/config/speciesConfig";
import {
  classifyAnimalPerformance,
  getSellingRecommendation,
  toNumber,
} from "@/features/animals/services/animalAnalyticsService";
import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import { reportInsightService } from "./reportInsightService";
import type {
  AnimalPerformanceRow,
  PerformanceAdgTrendPoint,
  PerformanceBreakdownPoint,
  PerformanceReportData,
  ReportFilters,
  ReportInsight,
} from "../types/report.types";

type AnimalRow = {
  id: string;
  tag_number: string;
  status: AnimalPerformanceRow["status"];
  purchase_weight_kg: number | string;
  purchase_date: string;
  species: { id: string; name: string; slug: string } | null;
};

type WeightRow = {
  animal_id: string;
  recorded_at: string;
  weight_kg: number | string;
};

type PenAssignmentRow = {
  animal_id: string;
  pen_id: string;
  pen: { id: string; name: string } | null;
};

type HealthRow = {
  animal_id: string;
  health_status: string;
  created_at: string;
};

type AlertRow = {
  animal_id: string | null;
  status: string;
};

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number | null, digits = 3) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function latestWeightOnOrBefore(weights: WeightRow[], date: string) {
  return [...weights]
    .filter((item) => item.recorded_at <= date)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
}

function groupByAnimal(weights: WeightRow[]) {
  const grouped = new Map<string, WeightRow[]>();
  for (const row of weights) {
    const current = grouped.get(row.animal_id) ?? [];
    current.push(row);
    grouped.set(row.animal_id, current);
  }
  return grouped;
}

function sumByName(
  rows: AnimalPerformanceRow[],
  selector: (row: AnimalPerformanceRow) => number | null,
) {
  const grouped = new Map<string, number>();

  for (const row of rows) {
    const current = grouped.get(row.speciesName) ?? 0;
    grouped.set(row.speciesName, current + (selector(row) ?? 0));
  }

  return [...grouped.entries()]
    .map<PerformanceBreakdownPoint>(([name, value]) => ({ name, value: round(value, 2) ?? 0 }))
    .sort((a, b) => b.value - a.value);
}

function countByName(
  rows: AnimalPerformanceRow[],
  nameSelector: (row: AnimalPerformanceRow) => string,
) {
  const grouped = new Map<string, number>();

  for (const row of rows) {
    const key = nameSelector(row);
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map<PerformanceBreakdownPoint>(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildFallbackInsights(report: PerformanceReportData): ReportInsight[] {
  const lowestPen = report.underperformingByPen[0];
  const firstRisk = report.underperformingRows[0];

  const insights: ReportInsight[] = [
    {
      id: "underperforming-count",
      severity: report.summary.underperformingAnimals > 0 ? "warning" : "success",
      title:
        report.summary.underperformingAnimals > 0
          ? `${report.summary.underperformingAnimals} animals are below expected growth`
          : "No underperforming animals in the selected range",
      detail:
        report.summary.underperformingAnimals > 0
          ? "Review feed plan and health notes for flagged animals to prevent margin erosion."
          : "Current weight trajectory is stable across monitored animals.",
    },
    {
      id: "pen-performance",
      severity: lowestPen ? "warning" : "info",
      title: lowestPen
        ? `${lowestPen.name} has the highest count of underperformers`
        : "No pen-level hotspots detected",
      detail: lowestPen
        ? "Inspect feed allocation quality, crowding, and health interventions for this pen first."
        : "Continue tracking pen-level trends to catch early performance regressions.",
    },
    {
      id: "risk-animal",
      severity: firstRisk ? "danger" : "info",
      title: firstRisk
        ? `${firstRisk.tagNumber} needs immediate review`
        : "No high-risk animal recommendation",
      detail: firstRisk
        ? `${firstRisk.tagNumber} has ${firstRisk.activeAlerts} active alerts and ${firstRisk.healthStatus} health status.`
        : "Growth and health signals are not indicating immediate risk in the current period.",
    },
  ];

  return insights;
}

function adgFromWeights(
  startWeightKg: number,
  endWeightKg: number,
  startDate: string,
  endDate: string,
) {
  const days = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));
  if (days <= 0) return null;
  return (endWeightKg - startWeightKg) / days;
}

export const performanceReportService = {
  async getReport(farmId: string, filters: ReportFilters): Promise<PerformanceReportData> {
    let animalQuery = db
      .from("animals")
      .select(
        "id, tag_number, status, purchase_weight_kg, purchase_date, species:animal_species(id, name, slug)",
      )
      .eq("farm_id", farmId);

    if (filters.speciesId) animalQuery = animalQuery.eq("species_id", filters.speciesId);
    if (filters.animalStatus !== "all")
      animalQuery = animalQuery.eq("status", filters.animalStatus);

    const { data: animalsData, error: animalsError } = await animalQuery;
    if (animalsError) handleSupabaseError(animalsError);

    const animals = (animalsData ?? []) as AnimalRow[];
    const animalIds = animals.map((animal) => animal.id);

    if (animalIds.length === 0) {
      const empty: PerformanceReportData = {
        filters,
        summary: {
          totalActiveAnimals: 0,
          averageDailyGainKgPerDay: null,
          averageCurrentWeightKg: null,
          totalWeightGainedKg: 0,
          underperformingAnimals: 0,
          negativeGainAnimals: 0,
          readyForSaleAnimals: 0,
        },
        adgTrend: [],
        gainBySpecies: [],
        underperformingByPen: [],
        performanceCategories: [],
        topPerformers: [],
        animalRows: [],
        underperformingRows: [],
        insights: [],
      };

      return empty;
    }

    const [weightsResult, penResult, healthResult, alertResult] = await Promise.all([
      db
        .from("weight_records")
        .select("animal_id, recorded_at, weight_kg")
        .eq("farm_id", farmId)
        .in("animal_id", animalIds)
        .lte("recorded_at", filters.endDate),
      db
        .from("animal_pen_assignments")
        .select("animal_id, pen_id, pen:pens(id, name)")
        .eq("farm_id", farmId)
        .is("ended_at", null)
        .in("animal_id", animalIds),
      db
        .from("health_assessments")
        .select("animal_id, health_status, created_at")
        .eq("farm_id", farmId)
        .in("animal_id", animalIds)
        .order("created_at", { ascending: false }),
      db
        .from("alerts")
        .select("animal_id, status")
        .eq("farm_id", farmId)
        .in("animal_id", animalIds)
        .in("status", ["open", "reviewing"]),
    ]);

    if (weightsResult.error) handleSupabaseError(weightsResult.error);
    if (penResult.error) handleSupabaseError(penResult.error);
    if (healthResult.error) handleSupabaseError(healthResult.error);
    if (alertResult.error) handleSupabaseError(alertResult.error);

    const allWeights = (weightsResult.data ?? []) as WeightRow[];
    const weightsByAnimal = groupByAnimal(allWeights);

    const penByAnimal = new Map<string, { id: string | null; name: string }>(
      ((penResult.data ?? []) as PenAssignmentRow[]).map((assignment) => [
        assignment.animal_id,
        {
          id: assignment.pen_id,
          name: assignment.pen?.name ?? "Unassigned",
        },
      ]),
    );

    const healthByAnimal = new Map<string, string>();
    for (const item of (healthResult.data ?? []) as HealthRow[]) {
      if (!healthByAnimal.has(item.animal_id)) {
        healthByAnimal.set(item.animal_id, item.health_status);
      }
    }

    const alertsByAnimal = new Map<string, number>();
    for (const alert of (alertResult.data ?? []) as AlertRow[]) {
      if (!alert.animal_id) continue;
      alertsByAnimal.set(alert.animal_id, (alertsByAnimal.get(alert.animal_id) ?? 0) + 1);
    }

    let rows = animals.map<AnimalPerformanceRow>((animal) => {
      const speciesName = animal.species?.name ?? "Unknown species";
      const speciesSlug = animal.species?.slug ?? "cattle";
      const speciesConfig = getSpeciesConfig(speciesSlug);
      const pen = penByAnimal.get(animal.id) ?? { id: null, name: "Unassigned" };

      const animalWeights = weightsByAnimal.get(animal.id) ?? [];
      const startWeightRecord = latestWeightOnOrBefore(animalWeights, filters.startDate);
      const endWeightRecord = latestWeightOnOrBefore(animalWeights, filters.endDate);

      const startWeightKg = startWeightRecord
        ? toNumber(startWeightRecord.weight_kg)
        : toNumber(animal.purchase_weight_kg);
      const startDate = startWeightRecord?.recorded_at ?? animal.purchase_date;

      const currentWeightKg = endWeightRecord ? toNumber(endWeightRecord.weight_kg) : startWeightKg;
      const adg = adgFromWeights(startWeightKg, currentWeightKg, startDate, filters.endDate);
      const growthStatus = classifyAnimalPerformance(adg, speciesSlug);
      const recommendation = getSellingRecommendation(currentWeightKg, adg, speciesSlug);

      return {
        animalId: animal.id,
        tagNumber: animal.tag_number,
        speciesName,
        speciesSlug,
        penId: pen.id,
        penName: pen.name,
        status: animal.status,
        startWeightKg: round(startWeightKg, 2) ?? 0,
        currentWeightKg: round(currentWeightKg, 2) ?? 0,
        totalGainKg: round(currentWeightKg - startWeightKg, 2) ?? 0,
        adgKgPerDay: round(adg, 3),
        expectedAdgKgPerDay: speciesConfig.expectedAdgRange.normal,
        healthStatus: healthByAnimal.get(animal.id) ?? "unknown",
        growthStatus,
        recommendation,
        activeAlerts: alertsByAnimal.get(animal.id) ?? 0,
      };
    });

    if (filters.penId) {
      rows = rows.filter((row) => row.penId === filters.penId);
    }

    const adgValues = rows
      .map((row) => row.adgKgPerDay)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const currentWeights = rows.map((row) => row.currentWeightKg);

    const underperformingRows = rows.filter((row) =>
      ["Critical", "Underperforming"].includes(row.growthStatus),
    );

    const trendMap = new Map<string, number[]>();
    for (const row of rows) {
      const animalWeights = (weightsByAnimal.get(row.animalId) ?? []).filter(
        (item) => item.recorded_at >= filters.startDate && item.recorded_at <= filters.endDate,
      );
      const baseWeight = row.startWeightKg;

      for (const weight of animalWeights) {
        const gain = toNumber(weight.weight_kg) - baseWeight;
        const days = differenceInCalendarDays(
          parseISO(weight.recorded_at),
          parseISO(filters.startDate),
        );
        if (days <= 0) continue;

        const adg = gain / days;
        const entries = trendMap.get(weight.recorded_at) ?? [];
        entries.push(adg);
        trendMap.set(weight.recorded_at, entries);
      }
    }

    const adgTrend = [...trendMap.entries()]
      .map<PerformanceAdgTrendPoint>(([date, values]) => ({
        date,
        averageAdgKgPerDay: round(average(values), 3) ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const report: PerformanceReportData = {
      filters,
      summary: {
        totalActiveAnimals: rows.filter((row) => row.status === "active").length,
        averageDailyGainKgPerDay: round(average(adgValues), 3),
        averageCurrentWeightKg: round(average(currentWeights), 2),
        totalWeightGainedKg:
          round(
            rows.reduce((sum, row) => sum + row.totalGainKg, 0),
            2,
          ) ?? 0,
        underperformingAnimals: underperformingRows.length,
        negativeGainAnimals: rows.filter((row) => row.totalGainKg < 0).length,
        readyForSaleAnimals: rows.filter((row) => row.recommendation.includes("sale")).length,
      },
      adgTrend,
      gainBySpecies: sumByName(rows, (row) => row.totalGainKg),
      underperformingByPen: countByName(underperformingRows, (row) => row.penName),
      performanceCategories: countByName(rows, (row) => row.growthStatus),
      topPerformers: [...rows]
        .sort((a, b) => (b.adgKgPerDay ?? -Infinity) - (a.adgKgPerDay ?? -Infinity))
        .slice(0, 5),
      animalRows: [...rows].sort(
        (a, b) => (b.adgKgPerDay ?? -Infinity) - (a.adgKgPerDay ?? -Infinity),
      ),
      underperformingRows: [...underperformingRows].sort(
        (a, b) => (a.adgKgPerDay ?? Infinity) - (b.adgKgPerDay ?? Infinity),
      ),
      insights: [],
    };

    const fallbackInsights = buildFallbackInsights(report);
    report.insights = await reportInsightService.getInsights({
      farmId,
      reportType: "performance",
      filters,
      fallbackInsights,
    });

    return report;
  },
};
