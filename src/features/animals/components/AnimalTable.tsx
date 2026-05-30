import { Menu, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimalStatusBadge } from "./AnimalStatusBadge";
import { GrowthStatusBadge } from "./GrowthStatusBadge";
import { SpeciesBadge } from "./SpeciesBadge";
import type { AnimalStatus, AnimalViewModel } from "../types/animal.types";

type Props = {
  animals: AnimalViewModel[];
  isLoading?: boolean;
  onViewAnimal: (animalId: string) => void;
  onEditAnimal: (animal: AnimalViewModel) => void;
  onChangeStatus: (animal: AnimalViewModel, status: AnimalStatus) => void;
  onDeleteAnimal: (animal: AnimalViewModel) => void;
};

const statusOptions: Array<{ value: AnimalStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "sick", label: "Sick" },
  { value: "sold", label: "Sold" },
  { value: "removed", label: "Removed" },
  { value: "dead", label: "Dead" },
];

function formatNumber(value: number | null, suffix = "") {
  if (value === null || Number.isNaN(value)) return "-";
  return `${value.toFixed(2)}${suffix}`;
}

export function AnimalTable({
  animals,
  isLoading,
  onViewAnimal,
  onEditAnimal,
  onChangeStatus,
  onDeleteAnimal,
}: Props) {
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
            <tr
              key={animal.id}
              tabIndex={0}
              onClick={() => onViewAnimal(animal.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onViewAnimal(animal.id);
                }
              }}
              className="cursor-pointer border-t border-farm-600/30 outline-none transition-colors hover:bg-farm-700/30 focus-visible:bg-farm-700/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-farm-lime/70"
            >
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
              <td
                className="px-5 py-3 text-right"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="ml-auto h-8 w-8"
                      aria-label={`Actions for ${animal.tagNumber}`}
                      title="Animal actions"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-farm-900">
                    <DropdownMenuItem onClick={() => onEditAnimal(animal)}>
                      <Pencil className="h-4 w-4" />
                      Edit animal details
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-farm-900">
                        {statusOptions.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            disabled={animal.status === option.value}
                            onClick={() => onChangeStatus(animal, option.value)}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteAnimal(animal)}
                      className="text-farm-danger focus:text-farm-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete animal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
