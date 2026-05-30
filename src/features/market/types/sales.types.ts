import type { AnimalViewModel } from "@/features/animals/types/animal.types";
import type { PriceBasis } from "./market.types";
import type { SellingPredictionViewModel } from "./sellingPrediction.types";

export type PaymentStatus = "paid" | "partially_paid" | "unpaid";
export type SaleStatus = "completed" | "voided" | "pending_payment" | "cancelled";
export type PredictionAccuracy =
  | "accurate"
  | "close"
  | "overestimated"
  | "underestimated"
  | "not_linked";
export type SaleAction = "create" | "update" | "void";

export type SalesRecordRow = {
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
  sold_at: string;
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
  notes: string | null;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
  animal?: { id: string; tag_number: string; status: string | null; purchase_price?: number | string | null } | null;
  species?: { id: string; name: string; slug: string } | null;
  market_price?: { id: string; price_per_kg: number | string; recorded_at: string } | null;
  prediction?: {
    id: string;
    best_sell_date: string | null;
    predicted_weight_kg: number | string | null;
    expected_profit: number | string | null;
  } | null;
};

export type SalesFilters = {
  dateFrom?: string;
  dateTo?: string;
  speciesId?: string;
  buyer?: string;
  saleStatus?: SaleStatus | "all";
  paymentStatus?: PaymentStatus | "all";
  profitStatus?: "all" | "profit" | "loss";
};

export type SalesRecordPayload = {
  farmId: string;
  animalId: string;
  buyerName?: string | null;
  buyerContact?: string | null;
  soldAt: string;
  saleWeightKg: number;
  pricePerKg: number;
  priceBasis: PriceBasis;
  currency: string;
  grossAmount?: number | null;
  healthCost?: number | null;
  otherCost?: number | null;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createMarketPrice?: boolean;
  marketPriceId?: string | null;
  predictionId?: string | null;
};

export type SalesRecordViewModel = {
  id: string;
  farmId: string;
  animalId: string;
  tagNumber: string;
  animalStatus: string | null;
  speciesId: string | null;
  speciesName: string;
  buyerName: string;
  buyerContact: string | null;
  soldAt: string;
  saleWeightKg: number;
  pricePerKg: number;
  priceBasis: PriceBasis;
  currency: string;
  grossAmount: number;
  totalAmount: number;
  purchaseCost: number;
  feedCost: number;
  healthCost: number;
  otherCost: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercentage: number | null;
  marketPriceId: string | null;
  predictionId: string | null;
  paymentStatus: PaymentStatus;
  saleStatus: SaleStatus;
  predictionAccuracy: PredictionAccuracy;
  marketComparisonPercentage: number | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  voidedAt: string | null;
  voidReason: string | null;
};

export type SaleDraftContext = {
  animal: AnimalViewModel;
  feedCost: number;
  latestMarketPrice: number | null;
  latestMarketPriceId: string | null;
  latestPrediction: SellingPredictionViewModel | null;
};

export type SalesSummary = {
  totalRevenue: number;
  animalsSold: number;
  averagePricePerKg: number | null;
  averageProfitPerAnimal: number | null;
  bestSale: SalesRecordViewModel | null;
  lossMakingSales: number;
};

export type SalesTrendPoint = {
  week: string;
  revenue: number;
  profit: number;
  sales: number;
};

export type BuyerPerformanceRow = {
  buyerName: string;
  animalsBought: number;
  averagePricePerKg: number;
  totalRevenue: number;
};

export type SalesAnalyticsResult = {
  summary: SalesSummary;
  trend: SalesTrendPoint[];
  buyerPerformance: BuyerPerformanceRow[];
};
