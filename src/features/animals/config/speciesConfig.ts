export type SpeciesSlug = "cattle" | "pigs" | "goats";

export type SpeciesConfig = {
  slug: SpeciesSlug;
  label: string;
  singularLabel: string;
  tagPrefix: string;
  tagPlaceholder: string;
  expectedAdgRange: {
    poor: number;
    normal: number;
    excellent: number;
  };
  sellingWeightRangeKg: {
    min: number;
    ideal: number;
    max: number;
  };
};

export const speciesConfigs: Record<SpeciesSlug, SpeciesConfig> = {
  cattle: {
    slug: "cattle",
    label: "Cattle",
    singularLabel: "Cattle",
    tagPrefix: "COW",
    tagPlaceholder: "TAG-001",
    expectedAdgRange: {
      poor: 0.3,
      normal: 0.7,
      excellent: 1.2,
    },
    sellingWeightRangeKg: {
      min: 350,
      ideal: 450,
      max: 550,
    },
  },
  pigs: {
    slug: "pigs",
    label: "Pigs",
    singularLabel: "Pig",
    tagPrefix: "PIG",
    tagPlaceholder: "PIG-001",
    expectedAdgRange: {
      poor: 0.25,
      normal: 0.5,
      excellent: 0.8,
    },
    sellingWeightRangeKg: {
      min: 70,
      ideal: 100,
      max: 130,
    },
  },
  goats: {
    slug: "goats",
    label: "Goats",
    singularLabel: "Goat",
    tagPrefix: "GOAT",
    tagPlaceholder: "GOAT-001",
    expectedAdgRange: {
      poor: 0.05,
      normal: 0.1,
      excellent: 0.2,
    },
    sellingWeightRangeKg: {
      min: 25,
      ideal: 40,
      max: 60,
    },
  },
};

export const fallbackSpeciesConfig = speciesConfigs.cattle;

export function getSpeciesConfig(slug: string | null | undefined): SpeciesConfig {
  if (slug && slug in speciesConfigs) {
    return speciesConfigs[slug as SpeciesSlug];
  }

  return fallbackSpeciesConfig;
}
