import type { AnimalSpecies } from "@/features/animals/types/animal.types";

export type MarketSourceType =
  | "auction"
  | "abattoir"
  | "butcher"
  | "private_buyer"
  | "market_board"
  | "online"
  | "other";

export type PriceBasis = "live_weight" | "carcass_weight" | "per_head";

export type MarketSource = {
  id: string;
  farm_id: string;
  name: string;
  source_type: MarketSourceType;
  location: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketPrice = {
  id: string;
  farm_id: string;
  species_id: string | null;
  market_source_id: string | null;
  price_per_kg: number | string;
  currency: string;
  price_basis: PriceBasis;
  recorded_at: string;
  source: string | null;
  quality_grade: string | null;
  weight_min_kg: number | string | null;
  weight_max_kg: number | string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  species?: AnimalSpecies | null;
  market_source?: MarketSource | null;
};

export type MarketPriceFilters = {
  speciesId?: string;
  marketSourceId?: string;
  priceBasis?: PriceBasis;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type MarketSourcePayload = {
  farmId: string;
  name: string;
  sourceType: MarketSourceType;
  location?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type MarketPricePayload = {
  farmId: string;
  speciesId: string;
  marketSourceId: string;
  pricePerKg: number;
  currency: string;
  priceBasis: PriceBasis;
  recordedAt: string;
  qualityGrade?: string | null;
  weightMinKg?: number | null;
  weightMaxKg?: number | null;
  notes?: string | null;
};

export type MarketPriceViewModel = {
  id: string;
  speciesId: string | null;
  speciesName: string;
  sourceId: string | null;
  sourceName: string;
  sourceType: MarketSourceType | null;
  pricePerKg: number;
  currency: string;
  priceBasis: PriceBasis;
  recordedAt: string;
  qualityGrade: string | null;
  weightMinKg: number | null;
  weightMaxKg: number | null;
  notes: string | null;
  recordedBy: string | null;
};

export type MarketTrendPoint = {
  week: string;
  averagePrice: number;
  highPrice: number;
  lowPrice: number;
  records: number;
};

export type MarketStats = {
  latestPrice: MarketPriceViewModel | null;
  averagePrice: number | null;
  highestSource: string | null;
  lowestSource: string | null;
  priceChangePercent: number | null;
  recordsThisMonth: number;
};

export type MarketInsight = {
  id: string;
  severity: "info" | "success" | "warning";
  title: string;
  message: string;
};

export type MarketTrendResult = {
  stats: MarketStats;
  trend: MarketTrendPoint[];
  insights: MarketInsight[];
};
