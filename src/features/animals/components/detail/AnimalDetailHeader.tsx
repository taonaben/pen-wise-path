import { AnimalStatusBadge } from "../AnimalStatusBadge";
import { GrowthStatusBadge } from "../GrowthStatusBadge";
import { SpeciesBadge } from "../SpeciesBadge";
import type { AnimalPenAssignment, AnimalViewModel } from "../../types/animal.types";

type Props = {
  animal: AnimalViewModel;
  farmName: string;
  currentPen: AnimalPenAssignment | null | undefined;
};

export function AnimalDetailHeader({ animal, farmName, currentPen }: Props) {
  return (
    <section className="rounded-xl border bg-farm-800/80 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-farm-lime">
              {animal.tagNumber}
            </h1>
            <AnimalStatusBadge status={animal.status} />
          </div>
          <p className="mt-2 text-sm text-farm-muted">
            {animal.speciesLabel} - {animal.breedLabel} - {animal.sex ?? "Unspecified"}
          </p>
          <p className="mt-1 text-sm text-farm-muted">
            {farmName}
            {currentPen?.pen?.name ? ` - ${currentPen.pen.name}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SpeciesBadge label={animal.speciesLabel} />
          <GrowthStatusBadge performance={animal.performance} />
          <span className="inline-flex items-center rounded-full border border-farm-600/60 bg-farm-700/60 px-2.5 py-0.5 text-xs font-medium text-farm-muted">
            {animal.acquisitionLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
