export type AnimalSex = "male" | "female";
export type AnimalStatus = "active" | "sold" | "sick" | "removed" | "dead";
export type AnimalPerformance = "Critical" | "Underperforming" | "Normal" | "Excellent" | "Unknown";

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
  purchaseDate: string;
  purchaseWeightKg: number;
  purchasePrice: number;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type AnimalUpdatePayload = Partial<Omit<AnimalCreatePayload, "farmId">> & {
  farmId: string;
  animalId: string;
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

export type AnimalSummary = {
  total: number;
  cattle: number;
  pigs: number;
  goats: number;
  underperforming: number;
  readyForSale: number;
};
