import { supabase } from "@/shared/lib/supabase";
import { handleSupabaseError, requireData } from "@/shared/services/baseService";
import { auditService } from "@/features/farm/services/auditService";
import { animalService } from "@/features/animals/services/animalService";
import { marketPriceService } from "./marketPriceService";
import { sellingPredictionApi } from "./sellingPredictionApi";
import type {
  SaleDraftContext,
  SalesFilters,
  SalesRecordPayload,
  SalesRecordRow,
  SalesRecordViewModel,
} from "../types/sales.types";

// The project still uses placeholder generated DB types, so table queries need a local loose cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function mapSalesRecord(row: SalesRecordRow): SalesRecordViewModel {
  return {
    id: row.id,
    farmId: row.farm_id,
    animalId: row.animal_id,
    tagNumber: row.animal?.tag_number ?? "Unknown animal",
    animalStatus: row.animal?.status ?? null,
    speciesId: row.species_id,
    speciesName: row.species?.name ?? "Unspecified",
    buyerName: row.buyer_name ?? "Unspecified buyer",
    buyerContact: row.buyer_contact,
    soldAt: row.sold_at,
    saleWeightKg: toNumber(row.sale_weight_kg),
    pricePerKg: toNumber(row.price_per_kg),
    priceBasis: row.price_basis ?? "live_weight",
    currency: row.currency ?? "USD",
    grossAmount: toNumber(row.gross_amount, toNumber(row.total_amount)),
    totalAmount: toNumber(row.total_amount),
    purchaseCost: toNumber(row.purchase_cost),
    feedCost: toNumber(row.feed_cost),
    healthCost: toNumber(row.health_cost),
    otherCost: toNumber(row.other_cost),
    totalCost: toNumber(row.total_cost),
    netProfit: toNumber(row.net_profit),
    profitMarginPercentage:
      row.profit_margin_percentage === null ? null : toNumber(row.profit_margin_percentage),
    marketPriceId: row.market_price_id,
    predictionId: row.prediction_id,
    paymentStatus: row.payment_status ?? "paid",
    saleStatus: row.sale_status ?? "completed",
    predictionAccuracy: row.prediction_accuracy ?? "not_linked",
    marketComparisonPercentage:
      row.market_comparison_percentage === null ? null : toNumber(row.market_comparison_percentage),
    notes: row.notes,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    voidedAt: row.voided_at,
    voidReason: row.void_reason,
  };
}

function toFunctionPayload(action: "create" | "update", payload: SalesRecordPayload, saleId?: string) {
  return {
    action,
    farm_id: payload.farmId,
    sale_id: saleId,
    animal_id: payload.animalId,
    buyer_name: cleanText(payload.buyerName),
    buyer_contact: cleanText(payload.buyerContact),
    sold_at: payload.soldAt,
    sale_weight_kg: payload.saleWeightKg,
    price_per_kg: payload.pricePerKg,
    price_basis: payload.priceBasis,
    currency: payload.currency.trim().toUpperCase(),
    gross_amount: payload.grossAmount ?? null,
    health_cost: payload.healthCost ?? 0,
    other_cost: payload.otherCost ?? 0,
    payment_status: payload.paymentStatus,
    notes: cleanText(payload.notes),
    create_market_price: Boolean(payload.createMarketPrice),
    market_price_id: payload.marketPriceId ?? null,
    prediction_id: payload.predictionId ?? null,
  };
}

async function invokeSaleFunction(body: Record<string, unknown>): Promise<SalesRecordViewModel> {
  const { data, error } = await supabase.functions.invoke("record-animal-sale", { body });
  if (error) handleSupabaseError(error);
  const sale = requireData((data as { sale?: SalesRecordRow } | null)?.sale, "Sale response returned no data");
  return mapSalesRecord(sale as SalesRecordRow);
}

export const salesRecordService = {
  mapSalesRecord,

  async getSalesRecords(farmId: string, filters: SalesFilters = {}): Promise<SalesRecordViewModel[]> {
    let query = db
      .from("sales_records")
      .select(
        `
          *,
          animal:animals(id, tag_number, status, purchase_price),
          species:animal_species(id, name, slug),
          market_price:market_prices(id, price_per_kg, recorded_at),
          prediction:selling_predictions(id, best_sell_date, predicted_weight_kg, expected_profit)
        `,
      )
      .eq("farm_id", farmId)
      .order("sold_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.dateFrom) query = query.gte("sold_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("sold_at", filters.dateTo);
    if (filters.speciesId) query = query.eq("species_id", filters.speciesId);
    if (filters.saleStatus && filters.saleStatus !== "all") query = query.eq("sale_status", filters.saleStatus);
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      query = query.eq("payment_status", filters.paymentStatus);
    }
    if (filters.buyer?.trim()) query = query.ilike("buyer_name", `%${filters.buyer.trim()}%`);

    const { data, error } = await query;
    if (error) handleSupabaseError(error);

    let rows = ((data ?? []) as SalesRecordRow[]).map(mapSalesRecord);
    if (filters.profitStatus === "profit") rows = rows.filter((row) => row.netProfit >= 0);
    if (filters.profitStatus === "loss") rows = rows.filter((row) => row.netProfit < 0);
    return rows;
  },

  async getSaleById(farmId: string, saleId: string): Promise<SalesRecordViewModel> {
    const { data, error } = await db
      .from("sales_records")
      .select(
        `
          *,
          animal:animals(id, tag_number, status, purchase_price),
          species:animal_species(id, name, slug),
          market_price:market_prices(id, price_per_kg, recorded_at),
          prediction:selling_predictions(id, best_sell_date, predicted_weight_kg, expected_profit)
        `,
      )
      .eq("farm_id", farmId)
      .eq("id", saleId)
      .single();

    if (error) handleSupabaseError(error);
    return mapSalesRecord(requireData(data, "Sale not found") as SalesRecordRow);
  },

  async getSaleDraftContext(farmId: string, animalId: string): Promise<SaleDraftContext> {
    const animal = await animalService.getAnimal(farmId, animalId);

    const { data: feedRows, error: feedError } = await db
      .from("feeding_event_animals")
      .select("allocated_cost")
      .eq("farm_id", farmId)
      .eq("animal_id", animalId);
    if (feedError) handleSupabaseError(feedError);

    const feedCost = ((feedRows ?? []) as Array<{ allocated_cost: number | string }>).reduce(
      (sum, row) => sum + toNumber(row.allocated_cost),
      0,
    );
    const latestMarket = animal.species?.id
      ? await marketPriceService.getLatestMarketPrice(farmId, animal.species.id)
      : null;
    const latestPrediction = await sellingPredictionApi.getSellingPredictionByAnimal(farmId, animalId);

    return {
      animal,
      feedCost,
      latestMarketPrice: latestMarket?.pricePerKg ?? null,
      latestMarketPriceId: latestMarket?.id ?? null,
      latestPrediction,
    };
  },

  async createSaleRecord(payload: SalesRecordPayload): Promise<SalesRecordViewModel> {
    return invokeSaleFunction(toFunctionPayload("create", payload));
  },

  async updateSaleRecord(saleId: string, payload: SalesRecordPayload): Promise<SalesRecordViewModel> {
    return invokeSaleFunction(toFunctionPayload("update", payload, saleId));
  },

  async voidSaleRecord(farmId: string, saleId: string, reason?: string | null): Promise<SalesRecordViewModel> {
    return invokeSaleFunction({
      action: "void",
      farm_id: farmId,
      sale_id: saleId,
      void_reason: cleanText(reason),
    });
  },

  async getSaleAuditTrail(farmId: string, saleId: string) {
    return auditService.getAuditLogsForEntity({
      farmId,
      entityType: "sales_record",
      entityId: saleId,
    });
  },
};
