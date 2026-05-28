export type SpeciesThreshold = {
  species_slug: "cattle" | "pigs" | "goats";
  min_expected_adg_kg_per_day: number;
  normal_adg_kg_per_day: number;
  excellent_adg_kg_per_day: number;
  critical_weight_loss_kg: number;
  target_selling_weight_kg: number;
  max_expected_fcr?: number;
  max_days_without_weight_record: number;
};

const FALLBACK: SpeciesThreshold = {
  species_slug: "cattle",
  min_expected_adg_kg_per_day: 0.3,
  normal_adg_kg_per_day: 0.7,
  excellent_adg_kg_per_day: 1.2,
  critical_weight_loss_kg: 8,
  target_selling_weight_kg: 450,
  max_expected_fcr: 7,
  max_days_without_weight_record: 14,
};

const THRESHOLDS: Record<string, SpeciesThreshold> = {
  cattle: FALLBACK,
  pigs: {
    species_slug: "pigs",
    min_expected_adg_kg_per_day: 0.25,
    normal_adg_kg_per_day: 0.5,
    excellent_adg_kg_per_day: 0.8,
    critical_weight_loss_kg: 3,
    target_selling_weight_kg: 100,
    max_expected_fcr: 4,
    max_days_without_weight_record: 14,
  },
  goats: {
    species_slug: "goats",
    min_expected_adg_kg_per_day: 0.05,
    normal_adg_kg_per_day: 0.1,
    excellent_adg_kg_per_day: 0.2,
    critical_weight_loss_kg: 1.5,
    target_selling_weight_kg: 40,
    max_expected_fcr: 9,
    max_days_without_weight_record: 14,
  },
};

export function getSpeciesThreshold(slug: string | null | undefined): SpeciesThreshold {
  if (!slug) return FALLBACK;
  return THRESHOLDS[slug] ?? FALLBACK;
}
