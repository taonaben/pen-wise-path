import { corsHeaders } from "../_shared/cors.ts";

type ReportType = "performance" | "feed_cost" | "profitability";

type GenerateReportInsightsPayload = {
  farm_id?: string;
  report_type?: ReportType;
  date_range?: {
    start?: string;
    end?: string;
  };
  filters?: {
    species_id?: string | null;
    pen_id?: string | null;
    animal_status?: string;
  };
};

type Insight = {
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  detail: string;
};

type GenerateReportInsightsResponse = {
  summary: string;
  key_findings: Insight[];
  risks: Insight[];
  recommended_actions: Insight[];
};

function buildInsightsByReportType(reportType: ReportType): GenerateReportInsightsResponse {
  if (reportType === "performance") {
    return {
      summary: "Performance insights generated from growth, health, and alert patterns.",
      key_findings: [
        {
          severity: "info",
          title: "Monitor ADG trend consistency",
          detail:
            "Compare species-level ADG trend against expected growth ranges to identify drift early.",
        },
      ],
      risks: [
        {
          severity: "warning",
          title: "Underperforming cohorts may reduce sale readiness",
          detail:
            "Animals below expected ADG should be reviewed for feed quality, health issues, and pen pressure.",
        },
      ],
      recommended_actions: [
        {
          severity: "success",
          title: "Prioritize high-risk pens for field inspection",
          detail: "Start with pens showing repeated underperformance or active growth alerts.",
        },
      ],
    };
  }

  if (reportType === "feed_cost") {
    return {
      summary: "Feed cost insights generated from feed allocation and gain efficiency patterns.",
      key_findings: [
        {
          severity: "info",
          title: "Track feed-cost concentration",
          detail: "Identify feed types and pens responsible for the largest share of total cost.",
        },
      ],
      risks: [
        {
          severity: "warning",
          title: "High cost with weak gain signals poor conversion",
          detail: "Animals with high feed spend and low gain should be inspected immediately.",
        },
      ],
      recommended_actions: [
        {
          severity: "success",
          title: "Rebalance feed plans for low-efficiency groups",
          detail: "Adjust feed strategy by species and pen to reduce cost per kg gained.",
        },
      ],
    };
  }

  return {
    summary:
      "Profitability insights generated from sales outcomes, costs, and prediction accuracy.",
    key_findings: [
      {
        severity: "info",
        title: "Profit trend should be reviewed alongside margin trend",
        detail:
          "Rising revenue with flat margins can indicate cost pressure from feed or acquisition spend.",
      },
    ],
    risks: [
      {
        severity: "warning",
        title: "Prediction variance may impact sale timing decisions",
        detail:
          "Large gaps between predicted and actual profit should trigger model and timing reviews.",
      },
    ],
    recommended_actions: [
      {
        severity: "success",
        title: "Focus on buyer and species segments with best realized margin",
        detail: "Use historical margin by buyer and species to refine selling strategy.",
      },
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
        },
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const payload = (await req.json()) as GenerateReportInsightsPayload;
    const reportType = payload.report_type;

    if (!payload.farm_id || !reportType || !payload.date_range?.start || !payload.date_range?.end) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "farm_id, report_type, and date_range(start/end) are required",
          },
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const response = buildInsightsByReportType(reportType);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
