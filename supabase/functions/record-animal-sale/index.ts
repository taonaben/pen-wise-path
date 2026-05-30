import { corsHeaders } from "../_shared/cors.ts";
import { requireAuth, requireFarmAccess } from "../_shared/auth.ts";
import { HttpError, toErrorResponse } from "../_shared/errors.ts";
import { getSupabaseClients } from "../_shared/supabaseAdmin.ts";
import { calculateSale, toNumber } from "./calculations.ts";
import {
  clearActivePenAssignment,
  createSaleRecord,
  createVerifiedMarketPrice,
  getAnimal,
  getFeedCostToSale,
  getLatestMarketPrice,
  getLatestPrediction,
  getSale,
  hasOtherCompletedSale,
  updateAnimalSoldState,
  updateSaleRecord,
  voidSaleRecord,
  writeSaleAuditLog,
} from "./repositories.ts";
import { jsonResponse } from "./response.ts";
import type { ParsedSalePayload, RecordAnimalSalePayload } from "./types.ts";

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parsePositiveNumber(value: unknown, field: string, required = true): number | undefined {
  if (value === null || value === undefined || value === "") {
    if (required) throw new HttpError("INVALID_PAYLOAD", `${field} is required`, 400);
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError("INVALID_PAYLOAD", `${field} must be greater than 0`, 400);
  }
  return parsed;
}

function parseNonNegativeNumber(value: unknown, field: string): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError("INVALID_PAYLOAD", `${field} cannot be negative`, 400);
  }
  return parsed;
}

function parsePayload(body: RecordAnimalSalePayload): ParsedSalePayload {
  const action = body.action;
  const farmId = body.farm_id?.trim();

  if (!["create", "update", "void"].includes(action)) {
    throw new HttpError("INVALID_PAYLOAD", "action is invalid", 400);
  }
  if (!farmId) throw new HttpError("INVALID_PAYLOAD", "farm_id is required", 400);

  if (action === "void") {
    if (!body.sale_id?.trim()) {
      throw new HttpError("INVALID_PAYLOAD", "sale_id is required for void", 400);
    }
    return {
      action,
      farmId,
      saleId: body.sale_id.trim(),
      buyerName: null,
      buyerContact: null,
      priceBasis: "live_weight",
      currency: "USD",
      healthCost: 0,
      otherCost: 0,
      paymentStatus: "paid",
      notes: null,
      createMarketPrice: false,
      marketPriceId: null,
      predictionId: null,
      voidReason: cleanText(body.void_reason),
    };
  }

  const animalId = body.animal_id?.trim();
  const soldAt = body.sold_at?.trim();
  const priceBasis = body.price_basis ?? "live_weight";
  const paymentStatus = body.payment_status ?? "paid";
  const currency = (body.currency?.trim() || "USD").toUpperCase();

  if (action === "update" && !body.sale_id?.trim()) {
    throw new HttpError("INVALID_PAYLOAD", "sale_id is required for update", 400);
  }
  if (!animalId) throw new HttpError("INVALID_PAYLOAD", "animal_id is required", 400);
  if (!soldAt) throw new HttpError("INVALID_PAYLOAD", "sold_at is required", 400);
  if (!["live_weight", "carcass_weight", "per_head"].includes(priceBasis)) {
    throw new HttpError("INVALID_PAYLOAD", "price_basis is invalid", 400);
  }
  if (!["paid", "partially_paid", "unpaid"].includes(paymentStatus)) {
    throw new HttpError("INVALID_PAYLOAD", "payment_status is invalid", 400);
  }

  const saleWeightKg = parsePositiveNumber(body.sale_weight_kg, "sale_weight_kg");
  const pricePerKg = parsePositiveNumber(body.price_per_kg, "price_per_kg");
  const grossAmount =
    priceBasis === "per_head"
      ? parsePositiveNumber(body.gross_amount, "gross_amount")
      : body.gross_amount === null || body.gross_amount === undefined
        ? null
        : parsePositiveNumber(body.gross_amount, "gross_amount", false);

  return {
    action,
    farmId,
    saleId: body.sale_id?.trim(),
    animalId,
    buyerName: cleanText(body.buyer_name),
    buyerContact: cleanText(body.buyer_contact),
    soldAt,
    saleWeightKg,
    pricePerKg,
    priceBasis,
    currency,
    grossAmount: grossAmount ?? null,
    healthCost: parseNonNegativeNumber(body.health_cost, "health_cost"),
    otherCost: parseNonNegativeNumber(body.other_cost, "other_cost"),
    paymentStatus,
    notes: cleanText(body.notes),
    createMarketPrice: Boolean(body.create_market_price),
    marketPriceId: body.market_price_id?.trim() || null,
    predictionId: body.prediction_id?.trim() || null,
    voidReason: cleanText(body.void_reason),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" } },
      405,
    );
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new HttpError("UNAUTHORIZED", "Missing authorization header", 401);

    const { callerClient, adminClient } = getSupabaseClients(authorization);
    const { userId } = await requireAuth(callerClient);
    const payload = parsePayload((await req.json()) as RecordAnimalSalePayload);

    await requireFarmAccess({
      adminClient,
      userId,
      farmId: payload.farmId,
      mode: "farm_scan",
    });

    if (payload.action === "void") {
      const existingSale = await getSale({
        adminClient,
        farmId: payload.farmId,
        saleId: payload.saleId!,
      });
      if (existingSale.sale_status === "voided") {
        throw new HttpError("SALE_ALREADY_VOIDED", "Sale is already voided", 409);
      }

      const sale = await voidSaleRecord({
        adminClient,
        farmId: payload.farmId,
        saleId: payload.saleId!,
        userId,
        reason: payload.voidReason,
      });

      const hasOtherSale = await hasOtherCompletedSale({
        adminClient,
        farmId: payload.farmId,
        animalId: sale.animal_id,
        excludeSaleId: sale.id,
      });
      if (!hasOtherSale) {
        await updateAnimalSoldState({
          adminClient,
          farmId: payload.farmId,
          animalId: sale.animal_id,
          soldAt: null,
          sold: false,
        });
      }

      await writeSaleAuditLog({
        adminClient,
        farmId: payload.farmId,
        userId,
        action: "SALE_VOIDED",
        sale,
      });

      return jsonResponse({ success: true, sale });
    }

    const oldSale =
      payload.action === "update"
        ? await getSale({ adminClient, farmId: payload.farmId, saleId: payload.saleId! })
        : null;

    if (oldSale?.sale_status === "voided") {
      throw new HttpError("SALE_ALREADY_VOIDED", "Voided sales cannot be updated", 409);
    }

    const animal = await getAnimal({
      adminClient,
      farmId: payload.farmId,
      animalId: payload.animalId!,
    });

    const hasExistingSale = await hasOtherCompletedSale({
      adminClient,
      farmId: payload.farmId,
      animalId: animal.id,
      excludeSaleId: payload.saleId,
    });
    if (hasExistingSale) {
      throw new HttpError("ANIMAL_ALREADY_SOLD", "Animal already has a completed sale", 409);
    }

    const feedCost = await getFeedCostToSale({
      adminClient,
      farmId: payload.farmId,
      animalId: animal.id,
      soldAt: payload.soldAt!,
    });

    const prediction = await getLatestPrediction({
      adminClient,
      farmId: payload.farmId,
      animalId: animal.id,
      explicitPredictionId: payload.predictionId,
    });

    const existingMarketPrice = await getLatestMarketPrice({
      adminClient,
      farmId: payload.farmId,
      speciesId: animal.species_id,
      soldAt: payload.soldAt!,
      explicitMarketPriceId: payload.marketPriceId,
    });

    const calculation = calculateSale({
      payload,
      purchaseCost: toNumber(animal.purchase_price),
      feedCost,
      latestMarketPrice: existingMarketPrice,
      prediction,
    });

    const createdMarketPriceId = await createVerifiedMarketPrice({
      adminClient,
      payload,
      animal,
      userId,
    });
    const marketPriceId = createdMarketPriceId ?? existingMarketPrice?.id ?? null;

    const sale =
      payload.action === "create"
        ? await createSaleRecord({
            adminClient,
            payload,
            animal,
            calculation,
            userId,
            marketPriceId,
            predictionId: prediction?.id ?? null,
          })
        : await updateSaleRecord({
            adminClient,
            saleId: payload.saleId!,
            payload,
            animal,
            calculation,
            marketPriceId,
            predictionId: prediction?.id ?? null,
          });

    await clearActivePenAssignment({
      adminClient,
      farmId: payload.farmId,
      animalId: animal.id,
      reason: "Animal sold",
      endedAt: payload.soldAt!,
    });
    await updateAnimalSoldState({
      adminClient,
      farmId: payload.farmId,
      animalId: animal.id,
      soldAt: payload.soldAt!,
      sold: true,
    });

    if (oldSale && oldSale.animal_id !== animal.id) {
      const hasOldAnimalSale = await hasOtherCompletedSale({
        adminClient,
        farmId: payload.farmId,
        animalId: oldSale.animal_id,
        excludeSaleId: oldSale.id,
      });
      if (!hasOldAnimalSale) {
        await updateAnimalSoldState({
          adminClient,
          farmId: payload.farmId,
          animalId: oldSale.animal_id,
          soldAt: null,
          sold: false,
        });
      }
    }

    await writeSaleAuditLog({
      adminClient,
      farmId: payload.farmId,
      userId,
      action: payload.action === "create" ? "SALE_RECORDED" : "SALE_UPDATED",
      sale,
    });

    return jsonResponse({ success: true, sale });
  } catch (error) {
    const parsedError = toErrorResponse(error);
    return jsonResponse(parsedError.body, parsedError.status);
  }
});
