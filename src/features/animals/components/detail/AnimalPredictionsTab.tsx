import { StatCard } from "@/shared/components/ui/StatCard";
import { CalendarDays, TrendingUp } from "lucide-react";
import { buildAnimalProjections } from "../../services/animalAnalyticsService";
import { formatKg } from "./animalDetailFormat";
import type { AnimalViewModel } from "../../types/animal.types";

type Props = {
  animal: AnimalViewModel;
};

export function AnimalPredictionsTab({ animal }: Props) {
  const projections = buildAnimalProjections(animal);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {projections.map((projection) => (
          <StatCard
            key={projection.label}
            title={`${projection.label} Projected Weight`}
            value={formatKg(projection.projectedWeightKg)}
            description={
              projection.projectedGainKg !== null
                ? `+${projection.projectedGainKg.toFixed(2)} kg expected`
                : "Needs ADG data"
            }
            icon={
              projection.projectedGainKg !== null ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )
            }
            density="compact"
          />
        ))}
      </div>

      <div className="rounded-xl border bg-farm-800/80 p-5">
        <h2 className="text-base font-semibold">Recommended Selling Window</h2>
        <p className="mt-2 text-sm text-farm-muted">{animal.recommendation}</p>
      </div>
    </div>
  );
}
