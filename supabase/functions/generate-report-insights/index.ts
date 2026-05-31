import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";
import { HttpError, toErrorResponse } from "../_shared/errors.ts";
import { getSupabaseClients } from "../_shared/supabaseAdmin.ts";

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

type MembershipRow = {
  role: "owner" | "manager" | "worker";
  status: "active" | "inactive";
};

type WeightRow = { animal_id: string; recorded_at: string; weight_kg: number | string };
type AlertRow = { animal_id: string | null; status: string; alert_type: string };
type FeedingRow = {
  animal_id: string;
  allocated_cost: number | string;
  allocated_quantity_kg: number | string;
  feeding_event: { feeding_date: string; pen_id: string | null } | null;
  animal: { species_id: string | null; status: string | null; tag_number: string | null } | null;
};

type SaleRow = {
  id: string;
  animal_id: string;
  gross_amount: number | string;
  purchase_cost: number | string;
  feed_cost: number | string;
  health_cost: number | string;
  other_cost: number | string;
  prediction_accuracy: string;
  buyer_name: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function ensureInsightBuckets(summary: string): GenerateReportInsightsResponse {
  return {
    summary,
    key_findings: [],
    risks: [],
    recommended_actions: [],
  };
}

async function requireFarmMembership(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  userId: string;
}) {
  const { data, error } = await args.adminClient
    .from("farm_members")
    .select("role,status")
    .eq("farm_id", args.farmId)
    .eq("user_id", args.userId)
    .maybeSingle();

  if (error) throw new HttpError("FORBIDDEN", error.message, 403);

  const membership = data as MembershipRow | null;
  if (!membership || membership.status !== "active") {
    throw new HttpError("FORBIDDEN", "User is not an active farm member", 403);
  }
}

async function getPerformanceInsights(args: {
  adminClient: AnySupabaseClient;
  payload: Required<Pick<GenerateReportInsightsPayload, "farm_id" | "date_range" | "filters">>;
}): Promise<GenerateReportInsightsResponse> {
  const response = ensureInsightBuckets(
    "Performance insights generated from weight records, growth alerts, and status distribution.",
  );

  let animalQuery = args.adminClient
    .from("animals")
    .select("id, status")
    .eq("farm_id", args.payload.farm_id);

  if (args.payload.filters.species_id) {
    animalQuery = animalQuery.eq("species_id", args.payload.filters.species_id);
  }
  if (args.payload.filters.animal_status && args.payload.filters.animal_status !== "all") {
    animalQuery = animalQuery.eq("status", args.payload.filters.animal_status);
  }

  const { data: animals, error: animalsError } = await animalQuery;
  if (animalsError) throw new HttpError("SCAN_FAILED", animalsError.message, 500);

  const animalRows = (animals ?? []) as Array<{ id: string; status: string }>;
  const animalIds = animalRows.map((item) => item.id);

  if (animalIds.length === 0) {
    response.key_findings.push({
      severity: "info",
      title: "No animals matched the current filters",
      detail: "Adjust species, pen, or status filters to inspect performance insights.",
    });
    return response;
  }

  const [weightResult, alertResult] = await Promise.all([
    args.adminClient
      .from("weight_records")
      .select("animal_id, recorded_at, weight_kg")
      .eq("farm_id", args.payload.farm_id)
      .in("animal_id", animalIds)
      .gte("recorded_at", args.payload.date_range.start)
      .lte("recorded_at", args.payload.date_range.end),
    args.adminClient
      .from("alerts")
      .select("animal_id, status, alert_type")
      .eq("farm_id", args.payload.farm_id)
      .in("animal_id", animalIds)
      .in("status", ["open", "reviewing"]),
  ]);

  if (weightResult.error) throw new HttpError("SCAN_FAILED", weightResult.error.message, 500);
  if (alertResult.error) throw new HttpError("SCAN_FAILED", alertResult.error.message, 500);

  const weights = (weightResult.data ?? []) as WeightRow[];
  const alerts = (alertResult.data ?? []) as AlertRow[];

  const byAnimal = new Map<string, WeightRow[]>();
  for (const row of weights) {
    const entries = byAnimal.get(row.animal_id) ?? [];
    entries.push(row);
    byAnimal.set(row.animal_id, entries);
  }

  let negativeGain = 0;
  for (const animalId of animalIds) {
    const records = (byAnimal.get(animalId) ?? []).sort((a, b) =>
      a.recorded_at.localeCompare(b.recorded_at),
    );
    if (records.length < 2) continue;
    const first = toNumber(records[0].weight_kg);
    const last = toNumber(records[records.length - 1].weight_kg);
    if (last < first) negativeGain += 1;
  }

  const activeAlerts = alerts.length;
  response.key_findings.push({
    severity: "info",
    title: `${animalIds.length} animals analyzed in selected period`,
    detail: `${weights.length} weight records were considered between ${args.payload.date_range.start} and ${args.payload.date_range.end}.`,
  });

  response.risks.push({
    severity: activeAlerts > 0 ? "warning" : "success",
    title: `${activeAlerts} active growth-related alerts`,
    detail:
      activeAlerts > 0
        ? "Animals with open or reviewing alerts should be prioritized for field checks."
        : "No active alerts were found for the selected filter scope.",
  });

  response.recommended_actions.push({
    severity: negativeGain > 0 ? "danger" : "success",
    title:
      negativeGain > 0
        ? `${negativeGain} animals show negative weight gain`
        : "No negative weight-gain pattern detected",
    detail:
      negativeGain > 0
        ? "Inspect feed consistency, health events, and weighing cadence for affected animals."
        : "Continue routine growth monitoring and maintain current feeding plan quality.",
  });

  return response;
}

async function getFeedInsights(args: {
  adminClient: AnySupabaseClient;
  payload: Required<Pick<GenerateReportInsightsPayload, "farm_id" | "date_range" | "filters">>;
}): Promise<GenerateReportInsightsResponse> {
  const response = ensureInsightBuckets(
    "Feed insights generated from feeding allocations and feed-cost distribution.",
  );

  const { data, error } = await args.adminClient
    .from("feeding_event_animals")
    .select(
      "animal_id, allocated_cost, allocated_quantity_kg, feeding_event:feeding_events(feeding_date, pen_id), animal:animals(species_id, status, tag_number)",
    )
    .eq("farm_id", args.payload.farm_id);

  if (error) throw new HttpError("SCAN_FAILED", error.message, 500);

  const rows = ((data ?? []) as FeedingRow[]).filter((row) => {
    const date = row.feeding_event?.feeding_date;
    if (!date) return false;
    if (date < args.payload.date_range.start || date > args.payload.date_range.end) return false;
    if (
      args.payload.filters.species_id &&
      row.animal?.species_id !== args.payload.filters.species_id
    ) {
      return false;
    }
    if (args.payload.filters.pen_id && row.feeding_event?.pen_id !== args.payload.filters.pen_id) {
      return false;
    }
    if (args.payload.filters.animal_status && args.payload.filters.animal_status !== "all") {
      return row.animal?.status === args.payload.filters.animal_status;
    }
    return true;
  });

  if (rows.length === 0) {
    response.key_findings.push({
      severity: "info",
      title: "No feed allocations found in selected scope",
      detail: "Adjust date range or filters to review feed cost insight calculations.",
    });
    return response;
  }

  const totalCost = rows.reduce((sum, row) => sum + toNumber(row.allocated_cost), 0);
  const totalQty = rows.reduce((sum, row) => sum + toNumber(row.allocated_quantity_kg), 0);

  const animalCost = new Map<string, number>();
  for (const row of rows) {
    animalCost.set(
      row.animal_id,
      (animalCost.get(row.animal_id) ?? 0) + toNumber(row.allocated_cost),
    );
  }

  const highest = [...animalCost.entries()].sort((a, b) => b[1] - a[1])[0];
  const topShare = highest ? (highest[1] / totalCost) * 100 : 0;

  response.key_findings.push({
    severity: "info",
    title: `Total feed cost is $${totalCost.toFixed(2)}`,
    detail: `Total feed used is ${totalQty.toFixed(2)} kg in the selected period.`,
  });

  response.risks.push({
    severity: topShare >= 20 ? "warning" : "info",
    title: `Top animal cost concentration is ${topShare.toFixed(1)}%`,
    detail:
      topShare >= 20
        ? "Feed spend appears concentrated. Review whether high-cost animals are delivering expected growth."
        : "Feed spend appears reasonably distributed across tracked animals.",
  });

  response.recommended_actions.push({
    severity: "success",
    title: "Audit high-cost animals against weight gain",
    detail:
      "Combine this report with performance ADG and growth alerts to isolate inefficient feeding patterns.",
  });

  return response;
}

async function getProfitabilityInsights(args: {
  adminClient: AnySupabaseClient;
  payload: Required<Pick<GenerateReportInsightsPayload, "farm_id" | "date_range" | "filters">>;
}): Promise<GenerateReportInsightsResponse> {
  const response = ensureInsightBuckets(
    "Profitability insights generated from completed sales, cost structure, and prediction outcomes.",
  );

  let query = args.adminClient
    .from("sales_records")
    .select(
      "id, animal_id, gross_amount, purchase_cost, feed_cost, health_cost, other_cost, prediction_accuracy, buyer_name, sale_status, sold_at, species_id",
    )
    .eq("farm_id", args.payload.farm_id)
    .eq("sale_status", "completed")
    .gte("sold_at", args.payload.date_range.start)
    .lte("sold_at", args.payload.date_range.end);

  if (args.payload.filters.species_id) {
    query = query.eq("species_id", args.payload.filters.species_id);
  }

  const { data, error } = await query;
  if (error) throw new HttpError("SCAN_FAILED", error.message, 500);

  let rows = (data ?? []) as SaleRow[];

  if (args.payload.filters.pen_id && rows.length > 0) {
    const animalIds = [...new Set(rows.map((row) => row.animal_id))];
    const { data: penData, error: penError } = await args.adminClient
      .from("animal_pen_assignments")
      .select("animal_id, pen_id")
      .eq("farm_id", args.payload.farm_id)
      .is("ended_at", null)
      .in("animal_id", animalIds);

    if (penError) throw new HttpError("SCAN_FAILED", penError.message, 500);

    const penByAnimal = new Map(
      ((penData ?? []) as Array<{ animal_id: string; pen_id: string }>).map((item) => [
        item.animal_id,
        item.pen_id,
      ]),
    );

    rows = rows.filter((row) => penByAnimal.get(row.animal_id) === args.payload.filters.pen_id);
  }

  if (rows.length === 0) {
    response.key_findings.push({
      severity: "info",
      title: "No completed sales matched selected filters",
      detail: "Expand date range or clear filters to evaluate profitability insights.",
    });
    return response;
  }

  const totalRevenue = rows.reduce((sum, row) => sum + toNumber(row.gross_amount), 0);
  const totalCost = rows.reduce(
    (sum, row) =>
      sum +
      toNumber(row.purchase_cost) +
      toNumber(row.feed_cost) +
      toNumber(row.health_cost) +
      toNumber(row.other_cost),
    0,
  );
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const accuracyRows = rows.filter((row) => row.prediction_accuracy !== "not_linked");
  const accurateCount = accuracyRows.filter((row) =>
    ["accurate", "close"].includes(row.prediction_accuracy),
  ).length;
  const accuracyRate = accuracyRows.length > 0 ? (accurateCount / accuracyRows.length) * 100 : null;

  const buyerTotals = new Map<string, number>();
  for (const row of rows) {
    const buyer = row.buyer_name ?? "Unspecified buyer";
    buyerTotals.set(buyer, (buyerTotals.get(buyer) ?? 0) + toNumber(row.gross_amount));
  }
  const topBuyer = [...buyerTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  response.key_findings.push({
    severity: totalProfit >= 0 ? "success" : "warning",
    title: `Net profit is $${totalProfit.toFixed(2)} (${margin.toFixed(1)}% margin)`,
    detail: `Revenue: $${totalRevenue.toFixed(2)} | Total cost: $${totalCost.toFixed(2)}.`,
  });

  response.risks.push({
    severity:
      accuracyRate !== null && accuracyRate < 60
        ? "warning"
        : accuracyRate === null
          ? "info"
          : "success",
    title:
      accuracyRate !== null
        ? `Prediction accuracy is ${accuracyRate.toFixed(1)}%`
        : "No linked prediction outcomes available",
    detail:
      accuracyRate !== null
        ? "Compare prediction misses against market timing and price-basis selection."
        : "Record prediction links on sales to improve decision-quality feedback loops.",
  });

  response.recommended_actions.push({
    severity: "success",
    title: topBuyer
      ? `${topBuyer[0]} is the highest revenue buyer`
      : "Review buyer-level profitability",
    detail:
      "Prioritize buyer segments with strong realized margin and stable payment behavior for next sales cycles.",
  });

  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Method not allowed",
        },
      },
      405,
    );
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      throw new HttpError("UNAUTHORIZED", "Missing authorization header", 401);
    }

    const { callerClient, adminClient } = getSupabaseClients(authorization);
    const { userId } = await requireAuth(callerClient);

    const payload = (await req.json()) as GenerateReportInsightsPayload;
    const reportType = payload.report_type;

    if (!payload.farm_id || !reportType || !payload.date_range?.start || !payload.date_range?.end) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: "INVALID_PAYLOAD",
            message: "farm_id, report_type, and date_range(start/end) are required",
          },
        },
        400,
      );
    }

    await requireFarmMembership({
      adminClient,
      farmId: payload.farm_id,
      userId,
    });

    const normalizedPayload = {
      farm_id: payload.farm_id,
      date_range: {
        start: payload.date_range.start,
        end: payload.date_range.end,
      },
      filters: {
        species_id: payload.filters?.species_id ?? null,
        pen_id: payload.filters?.pen_id ?? null,
        animal_status: payload.filters?.animal_status ?? "all",
      },
    };

    let response: GenerateReportInsightsResponse;
    if (reportType === "performance") {
      response = await getPerformanceInsights({
        adminClient,
        payload: normalizedPayload,
      });
    } else if (reportType === "feed_cost") {
      response = await getFeedInsights({
        adminClient,
        payload: normalizedPayload,
      });
    } else {
      response = await getProfitabilityInsights({
        adminClient,
        payload: normalizedPayload,
      });
    }

    return jsonResponse(response, 200);
  } catch (error) {
    const parsed = toErrorResponse(error);
    return jsonResponse(parsed.body, parsed.status);
  }
});
