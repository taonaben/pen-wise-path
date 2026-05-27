import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PlaceholderLineChart } from "@/shared/components/charts/PlaceholderLineChart";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { GrowthStatusBadge } from "../components/GrowthStatusBadge";
import { SpeciesBadge } from "../components/SpeciesBadge";
import { useAnimal } from "../hooks/useAnimal";

function formatValue(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)} ${suffix}`;
}

export function AnimalDetailPage({ animalId }: { animalId: string }) {
  const { currentFarm } = useCurrentFarm();
  const animalQuery = useAnimal(currentFarm.id, animalId);
  const animal = animalQuery.data;

  return (
    <div className="space-y-5">
      <Link
        to="/animals"
        className="inline-flex items-center gap-1.5 text-sm text-farm-muted hover:text-farm-lime"
      >
        <ArrowLeft className="h-4 w-4" /> Back to animals
      </Link>

      {animalQuery.isLoading && (
        <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          Loading animal...
        </div>
      )}

      {animalQuery.isError && (
        <div className="rounded-2xl border border-farm-danger/30 bg-farm-danger/10 p-6 text-sm text-farm-danger">
          Animal could not be loaded.
        </div>
      )}

      {animal && (
        <>
          <PageHeader
            title={animal.tagNumber}
            description={`${animal.speciesLabel} - ${animal.breedLabel} - ${animal.sex ?? "Unspecified"}`}
          />

          <div className="flex flex-wrap gap-2">
            <SpeciesBadge label={animal.speciesLabel} />
            <GrowthStatusBadge performance={animal.performance} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard title="Current Weight" value={formatValue(animal.currentWeightKg, "kg")} />
            <StatCard
              title="Average Daily Gain"
              value={formatValue(animal.averageDailyGainKg, "kg/d")}
            />
            <StatCard title="Source" value={animal.acquisitionLabel} />
            <StatCard title="Starting Weight" value={formatValue(animal.purchaseWeightKg, "kg")} />
            <StatCard title="Initial Value" value={`$${animal.purchasePrice.toFixed(2)}`} />
            <StatCard
              title="Selling Recommendation"
              value={animal.recommendation}
              variant="success"
            />
          </div>

          <div className="rounded-2xl border bg-farm-800/80 p-5">
            <h2 className="text-base font-semibold">Notes</h2>
            <p className="mt-2 text-sm text-farm-muted">{animal.notes || "No notes recorded."}</p>
          </div>

          <PlaceholderLineChart title="Weight Over Time" />
        </>
      )}
    </div>
  );
}
