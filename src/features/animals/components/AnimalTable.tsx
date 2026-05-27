import { Link } from "@tanstack/react-router";
import { AnimalStatusBadge } from "./AnimalStatusBadge";
import { GrowthStatusBadge } from "./GrowthStatusBadge";
import { SpeciesBadge } from "./SpeciesBadge";
import type { AnimalViewModel } from "../types/animal.types";

type Props = {
  animals: AnimalViewModel[];
  isLoading?: boolean;
};

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}${suffix}`;
}

export function AnimalTable({ animals, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
        Loading animals...
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="rounded-2xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
        No animals match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-farm-800/80">
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
          <tr>
            {[
              "Tag",
              "Species",
              "Breed",
              "Sex",
              "Current Weight",
              "ADG",
              "Status",
              "Performance",
              "Recommendation",
              "Actions",
            ].map((heading) => (
              <th key={heading} className="px-5 py-3 text-left font-medium">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {animals.map((animal) => (
            <tr key={animal.id} className="border-t border-farm-600/30 hover:bg-farm-700/30">
              <td className="px-5 py-3 font-mono text-farm-lime">{animal.tagNumber}</td>
              <td className="px-5 py-3">
                <SpeciesBadge label={animal.speciesLabel} />
              </td>
              <td className="px-5 py-3">{animal.breedLabel}</td>
              <td className="px-5 py-3 capitalize text-farm-muted">{animal.sex ?? "-"}</td>
              <td className="px-5 py-3">{formatNumber(animal.currentWeightKg, " kg")}</td>
              <td className="px-5 py-3">{formatNumber(animal.averageDailyGainKg, " kg/d")}</td>
              <td className="px-5 py-3">
                <AnimalStatusBadge status={animal.status} />
              </td>
              <td className="px-5 py-3">
                <GrowthStatusBadge performance={animal.performance} />
              </td>
              <td className="px-5 py-3 text-farm-muted">{animal.recommendation}</td>
              <td className="px-5 py-3">
                <Link
                  to="/animals/$id"
                  params={{ id: animal.id }}
                  className="text-xs text-farm-lime hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
