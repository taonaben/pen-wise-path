export type FeedCategory =
  | "concentrate"
  | "roughage"
  | "silage"
  | "hay"
  | "supplement"
  | "mineral"
  | "mixed_ration"
  | "other";

export type FeedMovementType =
  | "purchase"
  | "feeding"
  | "adjustment_in"
  | "adjustment_out"
  | "spoilage"
  | "transfer_in"
  | "transfer_out"
  | "return";

export type FeedType = {
  id: string;
  farm_id: string;
  species_id: string | null;
  name: string;
  category: FeedCategory;
  cost_per_kg: number | string;
  protein_percentage: number | string | null;
  dry_matter_percentage: number | string | null;
  crude_fiber_percentage: number | string | null;
  energy_me_mj_per_kg: number | string | null;
  fat_percentage: number | string | null;
  calcium_percentage: number | string | null;
  phosphorus_percentage: number | string | null;
  low_stock_threshold_kg: number | string;
  is_active: boolean;
  description: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FeedBatch = {
  id: string;
  farm_id: string;
  feed_type_id: string;
  batch_number: string | null;
  supplier_name: string | null;
  purchase_date: string;
  expiry_date: string | null;
  initial_quantity_kg: number | string;
  unit_cost: number | string;
  total_cost: number | string;
  storage_location: string | null;
  nutrition_snapshot: Record<string, unknown>;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FeedMovement = {
  id: string;
  farm_id: string;
  feed_type_id: string;
  feed_batch_id: string | null;
  movement_type: FeedMovementType;
  quantity_kg: number | string;
  unit_cost: number | string | null;
  total_cost: number | string | null;
  movement_date: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type FeedTypeInventorySummary = {
  feedType: FeedType;
  stockOnHandKg: number;
  averageCostPerKg: number;
  stockValue: number;
  lowStock: boolean;
  expiringSoonBatches: number;
};

export type FeedInventorySummary = {
  totalFeedTypes: number;
  totalStockOnHandKg: number;
  lowStockItems: number;
  expiringSoonItems: number;
  totalStockValue: number;
};

export type FeedTypeCreatePayload = {
  farmId: string;
  speciesId?: string | null;
  name: string;
  category: FeedCategory;
  costPerKg: number;
  proteinPercentage?: number | null;
  dryMatterPercentage?: number | null;
  crudeFiberPercentage?: number | null;
  energyMeMjPerKg?: number | null;
  fatPercentage?: number | null;
  calciumPercentage?: number | null;
  phosphorusPercentage?: number | null;
  lowStockThresholdKg?: number;
  description?: string | null;
  notes?: string | null;
};

export type FeedBatchCreatePayload = {
  farmId: string;
  feedTypeId: string;
  batchNumber?: string | null;
  supplierName?: string | null;
  purchaseDate: string;
  expiryDate?: string | null;
  initialQuantityKg: number;
  unitCost: number;
  storageLocation?: string | null;
  nutritionSnapshot?: Record<string, unknown>;
  notes?: string | null;
};
