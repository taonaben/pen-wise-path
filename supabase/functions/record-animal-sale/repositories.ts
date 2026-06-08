import { HttpError } from "../_shared/errors.ts";
import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";
import type {
  AnimalRow,
  MarketPriceRow,
  ParsedSalePayload,
  PredictionRow,
  SaleCalculation,
  SaleRow,
} from "./types.ts";
import { toNumber } from "./calculations.ts";

export async function getAnimal(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
}): Promise<AnimalRow> {
  const { data, error } = await args.adminClient
    .from("animals")
    .select("id,farm_id,tag_number,species_id,purchase_price,status")
    .eq("farm_id", args.farmId)
    .eq("id", args.animalId)
    .maybeSingle();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  if (!data) throw new HttpError("ANIMAL_NOT_FOUND", "Animal not found", 404);
  return data as AnimalRow;
}

export async function getSale(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  saleId: string;
}): Promise<SaleRow> {
  const { data, error } = await args.adminClient
    .from("sales_records")
    .select("*")
    .eq("farm_id", args.farmId)
    .eq("id", args.saleId)
    .maybeSingle();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  if (!data) throw new HttpError("SALE_NOT_FOUND", "Sale record not found", 404);
  return data as SaleRow;
}

export async function hasOtherCompletedSale(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
  excludeSaleId?: string;
}): Promise<boolean> {
  let query = args.adminClient
    .from("sales_records")
    .select("id")
    .eq("farm_id", args.farmId)
    .eq("animal_id", args.animalId)
    .neq("sale_status", "voided")
    .limit(1);

  if (args.excludeSaleId) query = query.neq("id", args.excludeSaleId);

  const { data, error } = await query;
  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return (data ?? []).length > 0;
}

export async function getFeedCostToSale(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
  soldAt: string;
}): Promise<number> {
  const { data, error } = await args.adminClient
    .from("feeding_event_animals")
    .select("allocated_cost, feeding_event:feeding_events(feeding_date)")
    .eq("farm_id", args.farmId)
    .eq("animal_id", args.animalId);

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);

  return (
    (data ?? []) as Array<{
      allocated_cost: number | string;
      feeding_event?: { feeding_date?: string } | null;
    }>
  )
    .filter(
      (row) => !row.feeding_event?.feeding_date || row.feeding_event.feeding_date <= args.soldAt,
    )
    .reduce((sum, row) => sum + toNumber(row.allocated_cost), 0);
}

export async function getLatestMarketPrice(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  speciesId: string | null;
  soldAt: string;
  explicitMarketPriceId?: string | null;
}): Promise<MarketPriceRow | null> {
  if (args.explicitMarketPriceId) {
    const { data, error } = await args.adminClient
      .from("market_prices")
      .select("id,price_per_kg,recorded_at")
      .eq("farm_id", args.farmId)
      .eq("id", args.explicitMarketPriceId)
      .maybeSingle();

    if (error) throw new HttpError("SALE_FAILED", error.message, 500);
    return (data as MarketPriceRow | null) ?? null;
  }

  if (!args.speciesId) return null;

  const { data, error } = await args.adminClient
    .from("market_prices")
    .select("id,price_per_kg,recorded_at")
    .eq("farm_id", args.farmId)
    .eq("species_id", args.speciesId)
    .eq("price_basis", "live_weight")
    .lte("recorded_at", args.soldAt)
    .order("recorded_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return (data as MarketPriceRow | null) ?? null;
}

export async function getLatestPrediction(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
  explicitPredictionId?: string | null;
}): Promise<PredictionRow | null> {
  if (args.explicitPredictionId) {
    const { data, error } = await args.adminClient
      .from("selling_predictions")
      .select("id,best_sell_date,predicted_weight_kg,expected_profit")
      .eq("farm_id", args.farmId)
      .eq("id", args.explicitPredictionId)
      .maybeSingle();

    if (error) throw new HttpError("SALE_FAILED", error.message, 500);
    return (data as PredictionRow | null) ?? null;
  }

  const { data, error } = await args.adminClient
    .from("selling_predictions")
    .select("id,best_sell_date,predicted_weight_kg,expected_profit")
    .eq("farm_id", args.farmId)
    .eq("animal_id", args.animalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return (data as PredictionRow | null) ?? null;
}

export async function createVerifiedMarketPrice(args: {
  adminClient: AnySupabaseClient;
  payload: ParsedSalePayload;
  animal: AnimalRow;
  userId: string;
}): Promise<string | null> {
  if (!args.payload.createMarketPrice || !args.animal.species_id || !args.payload.soldAt)
    return null;

  const sourceName = args.payload.buyerName
    ? `Buyer - ${args.payload.buyerName}`
    : "Buyer - Sales Record";

  const { data: source, error: sourceError } = await args.adminClient
    .from("market_sources")
    .upsert(
      {
        farm_id: args.payload.farmId,
        name: sourceName,
        source_type: "private_buyer",
        contact_name: args.payload.buyerName,
        contact_phone: args.payload.buyerContact,
        is_active: true,
        created_by: args.userId,
      },
      { onConflict: "farm_id,name" },
    )
    .select("id")
    .single();

  if (sourceError) throw new HttpError("SALE_FAILED", sourceError.message, 500);

  const { data: price, error: priceError } = await args.adminClient
    .from("market_prices")
    .insert({
      farm_id: args.payload.farmId,
      species_id: args.animal.species_id,
      market_source_id: source.id,
      source: sourceName,
      price_per_kg: args.payload.pricePerKg,
      currency: args.payload.currency,
      price_basis: args.payload.priceBasis,
      recorded_at: args.payload.soldAt,
      notes: `Verified from sale of ${args.animal.tag_number}.`,
      created_by: args.userId,
    })
    .select("id")
    .single();

  if (priceError) throw new HttpError("SALE_FAILED", priceError.message, 500);
  return price.id as string;
}

export async function createSaleRecord(args: {
  adminClient: AnySupabaseClient;
  payload: ParsedSalePayload;
  animal: AnimalRow;
  calculation: SaleCalculation;
  userId: string;
  marketPriceId: string | null;
  predictionId: string | null;
}): Promise<SaleRow> {
  const { data, error } = await args.adminClient
    .from("sales_records")
    .insert({
      farm_id: args.payload.farmId,
      animal_id: args.animal.id,
      species_id: args.animal.species_id,
      buyer_name: args.payload.buyerName,
      buyer_contact: args.payload.buyerContact,
      sale_weight_kg: args.payload.saleWeightKg,
      price_per_kg: args.payload.pricePerKg,
      price_basis: args.payload.priceBasis,
      currency: args.payload.currency,
      gross_amount: args.calculation.grossAmount,
      total_amount: args.calculation.grossAmount,
      sold_at: args.payload.soldAt,
      purchase_cost: args.calculation.purchaseCost,
      feed_cost: args.calculation.feedCost,
      health_cost: args.calculation.healthCost,
      other_cost: args.calculation.otherCost,
      total_cost: args.calculation.totalCost,
      net_profit: args.calculation.netProfit,
      profit_margin_percentage: args.calculation.margin,
      market_price_id: args.marketPriceId,
      prediction_id: args.predictionId,
      payment_status: args.payload.paymentStatus,
      sale_status: "completed",
      prediction_accuracy: args.calculation.predictionAccuracy,
      market_comparison_percentage: args.calculation.marketComparisonPercentage,
      notes: args.payload.notes,
      created_by: args.userId,
      metadata: args.calculation.metadata,
    })
    .select("*")
    .single();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return data as SaleRow;
}

export async function updateSaleRecord(args: {
  adminClient: AnySupabaseClient;
  saleId: string;
  payload: ParsedSalePayload;
  animal: AnimalRow;
  calculation: SaleCalculation;
  marketPriceId: string | null;
  predictionId: string | null;
}): Promise<SaleRow> {
  const { data, error } = await args.adminClient
    .from("sales_records")
    .update({
      animal_id: args.animal.id,
      species_id: args.animal.species_id,
      buyer_name: args.payload.buyerName,
      buyer_contact: args.payload.buyerContact,
      sale_weight_kg: args.payload.saleWeightKg,
      price_per_kg: args.payload.pricePerKg,
      price_basis: args.payload.priceBasis,
      currency: args.payload.currency,
      gross_amount: args.calculation.grossAmount,
      total_amount: args.calculation.grossAmount,
      sold_at: args.payload.soldAt,
      purchase_cost: args.calculation.purchaseCost,
      feed_cost: args.calculation.feedCost,
      health_cost: args.calculation.healthCost,
      other_cost: args.calculation.otherCost,
      total_cost: args.calculation.totalCost,
      net_profit: args.calculation.netProfit,
      profit_margin_percentage: args.calculation.margin,
      market_price_id: args.marketPriceId,
      prediction_id: args.predictionId,
      payment_status: args.payload.paymentStatus,
      sale_status: "completed",
      prediction_accuracy: args.calculation.predictionAccuracy,
      market_comparison_percentage: args.calculation.marketComparisonPercentage,
      notes: args.payload.notes,
      metadata: args.calculation.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", args.payload.farmId)
    .eq("id", args.saleId)
    .select("*")
    .single();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return data as SaleRow;
}

export async function voidSaleRecord(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  saleId: string;
  userId: string;
  reason: string | null;
}): Promise<SaleRow> {
  const { data, error } = await args.adminClient
    .from("sales_records")
    .update({
      sale_status: "voided",
      voided_at: new Date().toISOString(),
      voided_by: args.userId,
      void_reason: args.reason,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", args.farmId)
    .eq("id", args.saleId)
    .select("*")
    .single();

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
  return data as SaleRow;
}

export async function updateAnimalSoldState(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
  soldAt: string | null;
  sold: boolean;
}) {
  const { error } = await args.adminClient
    .from("animals")
    .update({
      status: args.sold ? "sold" : "active",
      sold_at: args.sold ? args.soldAt : null,
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", args.farmId)
    .eq("id", args.animalId);

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
}

export async function clearActivePenAssignment(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  animalId: string;
  reason: string;
  endedAt?: string | null;
}) {
  const { error } = await args.adminClient
    .from("animal_pen_assignments")
    .update({
      ended_at: args.endedAt ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
      reason: args.reason,
    })
    .eq("farm_id", args.farmId)
    .eq("animal_id", args.animalId)
    .is("ended_at", null);

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
}

export async function writeSaleAuditLog(args: {
  adminClient: AnySupabaseClient;
  farmId: string;
  userId: string;
  action: "SALE_RECORDED" | "SALE_UPDATED" | "SALE_VOIDED";
  sale: SaleRow;
}) {
  const { error } = await args.adminClient.from("audit_logs").insert({
    farm_id: args.farmId,
    user_id: args.userId,
    action: args.action,
    entity_type: "sales_record",
    entity_id: args.sale.id,
    description:
      args.action === "SALE_VOIDED"
        ? `Voided sale record for ${args.sale.buyer_name ?? "buyer"}.`
        : `Recorded sale for ${args.sale.buyer_name ?? "buyer"} worth ${args.sale.currency} ${Number(args.sale.gross_amount).toFixed(2)}.`,
    metadata: {
      animal_id: args.sale.animal_id,
      gross_amount: args.sale.gross_amount,
      net_profit: args.sale.net_profit,
      sale_status: args.sale.sale_status,
    },
  });

  if (error) throw new HttpError("SALE_FAILED", error.message, 500);
}
