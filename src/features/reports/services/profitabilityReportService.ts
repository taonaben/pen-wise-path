import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError } from "@/shared/services/baseService";
import { reportInsightService } from "./reportInsightService";
import type { ProfitabilityReportData, ReportFilters, ReportInsight } from "../types/report.types";

type SaleRow = {
  id: string;
  animal_id: string;
  sold_at: string;
  sale_weight_kg: number | string;
  gross_amount: number | string;
  purchase_cost: number | string;
  feed_cost: number | string;
  health_cost: number | string;
  other_cost: number | string;
  net_profit: number | string;
  profit_margin_percentage: number | string | null;
  sale_status: string;
  prediction_accuracy: string;
  price_basis: "live_weight" | "carcass_weight" | "per_head";
  species_id: string | null;
  species: { id: string; slug: string; name: string } | null;
  animal: { tag_number: string } | null;
  prediction: {
    best_sell_date: string | null;
    expected_profit: number | string | null;
  } | null;
  buyer_name: string | null;
};

type PenAssignmentRow = {
  animal_id: string;
  pen_id: string;
};

type NormalizationFactorRow = {
  species_id: string | null;
  carcass_to_live_ratio: number | string;
  per_head_to_live_factor: number | string;
};

type NormalizationFactorSource = {
  carcassToLiveRatio: number;
  perHeadToLiveFactor: number;
  source: "species_default" | "farm_default_override" | "farm_species_override";
};

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const defaultNormalizationBySpecies: Record<
  string,
  { carcassToLiveRatio: number; perHeadToLiveFactor: number }
> = {
  cattle: { carcassToLiveRatio: 0.62, perHeadToLiveFactor: 1 },
  pigs: { carcassToLiveRatio: 0.72, perHeadToLiveFactor: 1 },
  goats: { carcassToLiveRatio: 0.55, perHeadToLiveFactor: 1 },
};

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function monthKey(dateIso: string) {
  return dateIso.slice(0, 7);
}

function getSpeciesDefaults(speciesSlug: string | null | undefined) {
  if (speciesSlug && defaultNormalizationBySpecies[speciesSlug]) {
    return defaultNormalizationBySpecies[speciesSlug];
  }

  return defaultNormalizationBySpecies.cattle;
}

function resolveNormalizationFactors(args: {
  row: SaleRow;
  farmDefaultFactor: NormalizationFactorSource | null;
  speciesFactorById: Map<string, NormalizationFactorSource>;
}): NormalizationFactorSource {
  const speciesFactor = args.row.species_id
    ? args.speciesFactorById.get(args.row.species_id)
    : undefined;
  if (speciesFactor) return speciesFactor;

  if (args.farmDefaultFactor) return args.farmDefaultFactor;

  const defaults = getSpeciesDefaults(args.row.species?.slug);
  return {
    carcassToLiveRatio: defaults.carcassToLiveRatio,
    perHeadToLiveFactor: defaults.perHeadToLiveFactor,
    source: "species_default",
  };
}

function normalizeRevenue(row: SaleRow, factors: NormalizationFactorSource) {
  const gross = toNumber(row.gross_amount);

  if (row.price_basis === "carcass_weight") {
    return {
      value: gross / factors.carcassToLiveRatio,
      basis: "carcass_live_weight_equivalent" as const,
      factor: factors.carcassToLiveRatio,
      source: factors.source,
    };
  }

  if (row.price_basis === "per_head") {
    return {
      value: gross / factors.perHeadToLiveFactor,
      basis: "per_head_live_weight_equivalent" as const,
      factor: factors.perHeadToLiveFactor,
      source: factors.source,
    };
  }

  return {
    value: gross,
    basis: "live_weight_equivalent" as const,
    factor: 1,
    source: factors.source,
  };
}

function buildFallbackInsights(report: ProfitabilityReportData): ReportInsight[] {
  const worst = report.soldRows.find((row) => row.netProfit < 0);

  return [
    {
      id: "margin-summary",
      severity:
        report.summary.averageProfitMargin !== null && report.summary.averageProfitMargin >= 0
          ? "success"
          : "warning",
      title: `Average margin is ${report.summary.averageProfitMargin?.toFixed(2) ?? "0.00"}%`,
      detail: "Track feed and purchase cost variation to keep margins stable across species.",
    },
    {
      id: "prediction-accuracy",
      severity:
        report.summary.predictionAccuracyRate !== null &&
        report.summary.predictionAccuracyRate >= 70
          ? "success"
          : "warning",
      title: `Prediction accuracy is ${report.summary.predictionAccuracyRate?.toFixed(1) ?? "0.0"}%`,
      detail: "Compare prediction misses against sale timing and market-price deviations.",
    },
    {
      id: "worst-sale",
      severity: worst ? "danger" : "info",
      title: worst
        ? `${worst.tagNumber} generated a loss-making sale`
        : "No loss-making sales found",
      detail: worst
        ? "Review feed duration, market timing, and buyer pricing strategy for similar animals."
        : "All sold animals remained at break-even or better in this period.",
    },
  ];
}

export const profitabilityReportService = {
  async getReport(farmId: string, filters: ReportFilters): Promise<ProfitabilityReportData> {
    let query = db
      .from("sales_records")
      .select(
        "id, animal_id, sold_at, sale_weight_kg, gross_amount, purchase_cost, feed_cost, health_cost, other_cost, net_profit, profit_margin_percentage, sale_status, prediction_accuracy, price_basis, buyer_name, species_id, species:animal_species(id, slug, name), animal:animals(tag_number), prediction:selling_predictions(best_sell_date, expected_profit)",
      )
      .eq("farm_id", farmId)
      .eq("sale_status", "completed")
      .gte("sold_at", filters.startDate)
      .lte("sold_at", filters.endDate)
      .order("sold_at", { ascending: false });

    if (filters.speciesId) query = query.eq("species_id", filters.speciesId);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);

    let rows = (data ?? []) as SaleRow[];

    if (filters.penId && rows.length > 0) {
      const animalIds = [...new Set(rows.map((row) => row.animal_id))];
      const { data: penData, error: penError } = await db
        .from("animal_pen_assignments")
        .select("animal_id, pen_id")
        .eq("farm_id", farmId)
        .is("ended_at", null)
        .in("animal_id", animalIds);

      if (penError) handleSupabaseError(penError);

      const penByAnimal = new Map(
        ((penData ?? []) as PenAssignmentRow[]).map((item) => [item.animal_id, item.pen_id]),
      );

      rows = rows.filter((row) => penByAnimal.get(row.animal_id) === filters.penId);
    }

    const speciesIds = [
      ...new Set(
        rows.map((row) => row.species_id).filter((value): value is string => Boolean(value)),
      ),
    ];
    const { data: normalizationData, error: normalizationError } = await db
      .from("report_normalization_factors")
      .select("species_id, carcass_to_live_ratio, per_head_to_live_factor")
      .eq("farm_id", farmId)
      .eq("is_active", true)
      .or(
        speciesIds.length > 0
          ? `species_id.is.null,species_id.in.(${speciesIds.join(",")})`
          : "species_id.is.null",
      );

    if (normalizationError) handleSupabaseError(normalizationError);

    const factorRows = (normalizationData ?? []) as NormalizationFactorRow[];
    let farmDefaultFactor: NormalizationFactorSource | null = null;
    const speciesFactorById = new Map<string, NormalizationFactorSource>();

    for (const row of factorRows) {
      const factorValue: NormalizationFactorSource = {
        carcassToLiveRatio: toNumber(row.carcass_to_live_ratio),
        perHeadToLiveFactor: toNumber(row.per_head_to_live_factor),
        source: row.species_id ? "farm_species_override" : "farm_default_override",
      };

      if (row.species_id) {
        speciesFactorById.set(row.species_id, factorValue);
      } else {
        farmDefaultFactor = factorValue;
      }
    }

    const soldRows = rows.map((row) => {
      const factors = resolveNormalizationFactors({
        row,
        farmDefaultFactor,
        speciesFactorById,
      });
      const normalized = normalizeRevenue(row, factors);
      const purchaseCost = toNumber(row.purchase_cost);
      const feedCost = toNumber(row.feed_cost);
      const otherCost = toNumber(row.health_cost) + toNumber(row.other_cost);
      const netProfit = normalized.value - (purchaseCost + feedCost + otherCost);

      return {
        saleId: row.id,
        tagNumber: row.animal?.tag_number ?? "Unknown",
        speciesName: row.species?.name ?? "Unknown",
        soldAt: row.sold_at,
        saleWeightKg: round(toNumber(row.sale_weight_kg), 2),
        revenue: round(normalized.value, 2),
        purchaseCost: round(purchaseCost, 2),
        feedCost: round(feedCost, 2),
        otherCost: round(otherCost, 2),
        netProfit: round(netProfit, 2),
        margin:
          normalized.value > 0
            ? round((netProfit / normalized.value) * 100, 2)
            : row.profit_margin_percentage === null
              ? null
              : round(toNumber(row.profit_margin_percentage), 2),
        normalizedBasis: normalized.basis,
        normalizationFactor: round(normalized.factor, 4),
        normalizationSource: normalized.source,
      };
    });

    const trendMap = new Map<string, { revenue: number; profit: number }>();
    for (const row of soldRows) {
      const key = monthKey(row.soldAt);
      const current = trendMap.get(key) ?? { revenue: 0, profit: 0 };
      current.revenue += row.revenue;
      current.profit += row.netProfit;
      trendMap.set(key, current);
    }

    const trend = [...trendMap.entries()]
      .map(([period, value]) => ({
        period,
        revenue: round(value.revenue, 2),
        profit: round(value.profit, 2),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const groupedSpecies = new Map<string, number>();
    const groupedBuyer = new Map<string, number>();
    const normalizedBySaleId = new Map(soldRows.map((row) => [row.saleId, row]));

    for (const row of rows) {
      const normalizedRow = normalizedBySaleId.get(row.id);
      const species = row.species?.name ?? "Unknown";
      const buyer = row.buyer_name ?? "Unspecified buyer";
      groupedSpecies.set(
        species,
        (groupedSpecies.get(species) ?? 0) + (normalizedRow?.netProfit ?? 0),
      );
      groupedBuyer.set(buyer, (groupedBuyer.get(buyer) ?? 0) + (normalizedRow?.netProfit ?? 0));
    }

    const withPredictions = rows.filter((row) => row.prediction !== null);
    const predictionRows = rows
      .filter((row) => row.prediction !== null)
      .map((row) => {
        const normalizedRow = normalizedBySaleId.get(row.id);
        const predictedProfit = row.prediction?.expected_profit
          ? round(toNumber(row.prediction.expected_profit), 2)
          : null;
        const actualProfit = normalizedRow?.netProfit ?? round(toNumber(row.net_profit), 2);

        return {
          saleId: row.id,
          tagNumber: row.animal?.tag_number ?? "Unknown",
          predictedSellWindow: row.prediction?.best_sell_date ?? "No prediction window",
          actualSaleDate: row.sold_at,
          predictedProfit,
          actualProfit,
          difference: predictedProfit === null ? null : round(actualProfit - predictedProfit, 2),
          accuracyStatus: row.prediction_accuracy,
        };
      });

    const soldAnimalIds = new Set(rows.map((row) => row.animal_id));
    const { data: unsoldPredictionData, error: predictionError } = await db
      .from("selling_predictions")
      .select("animal_id, expected_profit")
      .eq("farm_id", farmId)
      .order("created_at", { ascending: false });

    if (predictionError) handleSupabaseError(predictionError);

    const unsoldProjectedProfit = (
      (unsoldPredictionData ?? []) as Array<{
        animal_id: string;
        expected_profit: number | string | null;
      }>
    )
      .filter((row) => !soldAnimalIds.has(row.animal_id))
      .reduce((sum, row) => sum + toNumber(row.expected_profit), 0);

    const totalRevenue = soldRows.reduce((sum, row) => sum + row.revenue, 0);
    const totalProfit = soldRows.reduce((sum, row) => sum + row.netProfit, 0);

    const report: ProfitabilityReportData = {
      filters,
      summary: {
        totalRevenue: round(totalRevenue, 2),
        totalProfit: round(totalProfit, 2),
        averageProfitPerAnimal:
          soldRows.length > 0 ? round(totalProfit / soldRows.length, 2) : null,
        averageProfitMargin: totalRevenue > 0 ? round((totalProfit / totalRevenue) * 100, 2) : null,
        bestSaleAmount:
          soldRows.length > 0 ? Math.max(...soldRows.map((row) => row.netProfit)) : null,
        worstSaleAmount:
          soldRows.length > 0 ? Math.min(...soldRows.map((row) => row.netProfit)) : null,
        unsoldProjectedProfit: round(unsoldProjectedProfit, 2),
        predictionAccuracyRate:
          withPredictions.length > 0
            ? round(
                (withPredictions.filter((row) =>
                  ["accurate", "close"].includes(row.prediction_accuracy),
                ).length /
                  withPredictions.length) *
                  100,
                2,
              )
            : null,
      },
      trend,
      profitBySpecies: [...groupedSpecies.entries()]
        .map(([name, value]) => ({ name, value: round(value, 2) }))
        .sort((a, b) => b.value - a.value),
      profitByBuyer: [...groupedBuyer.entries()]
        .map(([name, value]) => ({ name, value: round(value, 2) }))
        .sort((a, b) => b.value - a.value),
      soldRows,
      predictionRows,
      insights: [],
    };

    const fallbackInsights = buildFallbackInsights(report);
    report.insights = await reportInsightService.getInsights({
      farmId,
      reportType: "profitability",
      filters,
      fallbackInsights,
    });

    return report;
  },
};
