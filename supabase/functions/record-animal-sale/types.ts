import type { AnySupabaseClient } from "../_shared/supabaseAdmin.ts";

export type SaleAction = "create" | "update" | "void";
export type PriceBasis = "live_weight" | "carcass_weight" | "per_head";
export type PaymentStatus = "paid" | "partially_paid" | "unpaid";
export type SaleStatus = "completed" | "voided" | "pending_payment" | "cancelled";
export type PredictionAccuracy =
  | "accurate"
  | "close"
  | "overestimated"
  | "underestimated"
  | "not_linked";

export type RecordAnimalSalePayload = {
  action: SaleAction;
  farm_id: string;
  sale_id?: string;
  animal_id?: string;
  buyer_name?: string | null;
  buyer_contact?: string | null;
  sold_at?: string;
  sale_weight_kg?: number;
  price_per_kg?: number;
  price_basis?: PriceBasis;
  currency?: string;
  gross_amount?: number | null;
  health_cost?: number | null;
  other_cost?: number | null;
  payment_status?: PaymentStatus;
  notes?: string | null;
  create_market_price?: boolean;
  market_price_id?: string | null;
  prediction_id?: string | null;
  void_reason?: string | null;
};

export type ParsedSalePayload = {
  action: SaleAction;
  farmId: string;
  saleId?: string;
  animalId?: string;
  buyerName: string | null;
  buyerContact: string | null;
  soldAt?: string;
  saleWeightKg?: number;
  pricePerKg?: number;
  priceBasis: PriceBasis;
  currency: string;
  grossAmount?: number | null;
  healthCost: number;
  otherCost: number;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createMarketPrice: boolean;
  marketPriceId: string | null;
  predictionId: string | null;
  voidReason: string | null;
};

export type AnimalRow = {
  id: string;
  farm_id: string;
  tag_number: string;
  species_id: string | null;
  purchase_price: number | string | null;
  status: string;
};

export type SaleRow = {
  id: string;
  farm_id: string;
  animal_id: string;
  species_id: string | null;
  buyer_name: string | null;
  buyer_contact: string | null;
  sale_weight_kg: number | string;
  price_per_kg: number | string;
  price_basis: PriceBasis;
  currency: string;
  gross_amount: number | string;
  total_amount: number | string;
  purchase_cost: number | string;
  feed_cost: number | string;
  health_cost: number | string;
  other_cost: number | string;
  total_cost: number | string;
  net_profit: number | string | null;
  profit_margin_percentage: number | string | null;
  market_price_id: string | null;
  prediction_id: string | null;
  payment_status: PaymentStatus;
  sale_status: SaleStatus;
  prediction_accuracy: PredictionAccuracy;
  market_comparison_percentage: number | string | null;
  sold_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type MarketPriceRow = {
  id: string;
  price_per_kg: number | string;
  recorded_at: string;
};

export type PredictionRow = {
  id: string;
  best_sell_date: string | null;
  predicted_weight_kg: number | string | null;
  expected_profit: number | string | null;
};

export type SaleCalculation = {
  grossAmount: number;
  purchaseCost: number;
  feedCost: number;
  healthCost: number;
  otherCost: number;
  totalCost: number;
  netProfit: number;
  margin: number | null;
  marketComparisonPercentage: number | null;
  predictionAccuracy: PredictionAccuracy;
  metadata: Record<string, unknown>;
};

export type SaleRepositoryArgs = {
  adminClient: AnySupabaseClient;
  farmId: string;
};
