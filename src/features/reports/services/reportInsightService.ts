import { supabase } from "@/shared/lib/supabase";
import type { ReportFilters, ReportInsight } from "../types/report.types";

type InsightRequest = {
  farmId: string;
  reportType: "performance" | "feed_cost" | "profitability";
  filters: ReportFilters;
  fallbackInsights: ReportInsight[];
};

type EdgeInsight = {
  severity?: "info" | "success" | "warning" | "danger";
  title?: string;
  detail?: string;
};

type GenerateReportInsightsResponse = {
  summary?: string;
  key_findings?: EdgeInsight[];
  risks?: EdgeInsight[];
  recommended_actions?: EdgeInsight[];
};

function normalizeEdgeInsight(item: EdgeInsight, index: number): ReportInsight | null {
  if (!item.title || !item.detail) return null;

  return {
    id: `edge-${index}-${item.title}`,
    severity: item.severity ?? "info",
    title: item.title,
    detail: item.detail,
  };
}

function shapeEdgeResponse(response: GenerateReportInsightsResponse): ReportInsight[] {
  const merged = [
    ...(response.key_findings ?? []),
    ...(response.risks ?? []),
    ...(response.recommended_actions ?? []),
  ];

  return merged
    .map((item, index) => normalizeEdgeInsight(item, index))
    .filter((item): item is ReportInsight => Boolean(item))
    .slice(0, 6);
}

export const reportInsightService = {
  async getInsights(args: InsightRequest): Promise<ReportInsight[]> {
    try {
      const { data, error } = await supabase.functions.invoke("generate-report-insights", {
        body: {
          farm_id: args.farmId,
          report_type: args.reportType,
          date_range: {
            start: args.filters.startDate,
            end: args.filters.endDate,
          },
          filters: {
            species_id: args.filters.speciesId ?? null,
            pen_id: args.filters.penId ?? null,
            animal_status: args.filters.animalStatus,
          },
        },
      });

      if (error) {
        return args.fallbackInsights;
      }

      const insights = shapeEdgeResponse((data ?? {}) as GenerateReportInsightsResponse);
      return insights.length > 0 ? insights : args.fallbackInsights;
    } catch {
      return args.fallbackInsights;
    }
  },
};
