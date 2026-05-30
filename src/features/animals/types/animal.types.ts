export type AnimalSex = "male" | "female";
export type AnimalStatus = "active" | "sold" | "sick" | "removed" | "dead";
export type AnimalPerformance = "Critical" | "Underperforming" | "Normal" | "Excellent" | "Unknown";
export type AnimalAcquisitionMethod = "purchased" | "bred_in_house";
export type PenStatus = "active" | "inactive" | "maintenance";
export type FeedingMethod = "individual" | "pen_group" | "custom_group";
export type FeedAllocationMethod = "equal_per_animal" | "by_weight_percentage" | "manual";
export type HealthSeverity = "low" | "medium" | "high" | "critical";
export type HealthEventStatus = "open" | "monitoring" | "resolved";

export type AnimalSpecies = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AnimalBreed = {
  id: string;
  species_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Animal = {
  id: string;
  farm_id: string;
  tag_number: string;
  breed: string | null;
  species_id: string;
  breed_id: string | null;
  sex: AnimalSex | null;
  purchase_date: string;
  purchase_weight_kg: number | string;
  purchase_price: number | string;
  acquisition_method: AnimalAcquisitionMethod;
  status: AnimalStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AnimalWithRelations = Animal & {
  species: AnimalSpecies | null;
  breed_record: AnimalBreed | null;
};

export type WeightRecord = {
  id: string;
  farm_id: string;
  animal_id: string;
  weight_kg: number | string;
  recorded_at: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at?: string;
};

export type BulkWeightFilters = {
  search?: string;
  penId?: string;
  speciesId?: string;
  breedId?: string;
  status?: AnimalStatus | "all";
};

export type BulkWeightRow = {
  animalId: string;
  tagNumber: string;
  speciesId: string | null;
  speciesLabel: string;
  breedId: string | null;
  breedLabel: string;
  status: AnimalStatus;
  penId: string | null;
  penName: string | null;
  existingWeightRecordId: string | null;
  existingWeightKg: number | null;
  latestPreviousWeightKg: number | null;
  latestPreviousWeightDate: string | null;
};

export type FeedType = {
  id: string;
  farm_id: string;
  species_id: string | null;
  name: string;
  cost_per_kg: number | string;
  protein_percentage: number | string | null;
  dry_matter_percentage: number | string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Pen = {
  id: string;
  farm_id: string;
  name: string;
  species_id: string | null;
  capacity: number | null;
  status: PenStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AnimalPenAssignment = {
  id: string;
  farm_id: string;
  animal_id: string;
  pen_id: string;
  started_at: string;
  ended_at: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
  pen?: Pen | null;
};

export type FeedingEvent = {
  id: string;
  farm_id: string;
  pen_id: string | null;
  feed_type_id: string | null;
  feeding_method: FeedingMethod;
  quantity_kg: number | string;
  feeding_date: string;
  allocation_method: FeedAllocationMethod;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  pen?: Pen | null;
  feed_type?: FeedType | null;
};

export type FeedingEventAnimal = {
  id: string;
  farm_id: string;
  feeding_event_id: string;
  animal_id: string;
  allocated_quantity_kg: number | string;
  allocated_cost: number | string;
  created_at: string;
  feeding_event?: FeedingEvent | null;
};

export type AnimalFeedAllocationViewModel = {
  id: string;
  animalId: string;
  eventId: string;
  date: string;
  feedTypeName: string;
  source: string;
  feedingMethod: FeedingMethod;
  allocationMethod: FeedAllocationMethod;
  allocatedQuantityKg: number;
  allocatedCost: number;
  notes: string | null;
  recordedBy: string | null;
};

export type HealthEvent = {
  id: string;
  farm_id: string;
  animal_id: string;
  event_date: string;
  event_type: string;
  severity: HealthSeverity;
  title: string;
  notes: string | null;
  treatment: string | null;
  status: HealthEventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AnimalFilters = {
  search?: string;
  speciesId?: string;
  breedId?: string;
  status?: AnimalStatus | "all";
  performance?: AnimalPerformance | "all";
  sex?: AnimalSex | "all";
};

export type AnimalCreatePayload = {
  farmId: string;
  speciesId: string;
  breedId?: string | null;
  tagNumber: string;
  sex: AnimalSex;
  acquisitionMethod: AnimalAcquisitionMethod;
  purchaseDate: string;
  purchaseWeightKg: number;
  purchasePrice: number;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type AnimalUpdatePayload = Partial<Omit<AnimalCreatePayload, "farmId">> & {
  farmId: string;
  animalId: string;
  status?: AnimalStatus;
};

export type AnimalViewModel = {
  id: string;
  farmId: string;
  tagNumber: string;
  legacyBreed: string | null;
  species: AnimalSpecies | null;
  breed: AnimalBreed | null;
  speciesLabel: string;
  speciesSlug: string;
  breedLabel: string;
  sex: AnimalSex | null;
  status: AnimalStatus;
  statusLabel: string;
  acquisitionMethod: AnimalAcquisitionMethod;
  acquisitionLabel: string;
  purchaseWeightKg: number;
  purchasePrice: number;
  purchaseDate: string;
  currentWeightKg: number | null;
  averageDailyGainKg: number | null;
  performance: AnimalPerformance;
  recommendation: string;
  notes: string | null;
  createdAt: string;
};

export type AnimalDetailMetrics = {
  currentWeightKg: number | null;
  startingWeightKg: number;
  totalGainKg: number;
  averageDailyGainKg: number | null;
  totalFeedConsumedKg: number;
  totalFeedCost: number;
  feedConversionRatio: number | null;
  feedCostPerKgGained: number | null;
  estimatedMargin: number | null;
};

export type AnimalProjection = {
  label: string;
  days: number;
  projectedWeightKg: number | null;
  projectedGainKg: number | null;
};

export type AnimalSummary = {
  total: number;
  cattle: number;
  pigs: number;
  goats: number;
  underperforming: number;
  readyForSale: number;
};
