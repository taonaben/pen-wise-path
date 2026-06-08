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
import type { AnimalStatus, AnimalViewModel, Pen } from "../types/animal.types";

type Props = {
  animals: AnimalViewModel[];
  pens: Pen[];
  currentPenByAnimal: Map<string, string>;
  isLoading?: boolean;
  onViewAnimal: (animalId: string) => void;
  onEditAnimal: (animal: AnimalViewModel) => void;
  onChangeStatus: (animal: AnimalViewModel, status: AnimalStatus) => void;
  onDeleteAnimal: (animal: AnimalViewModel) => void;
  onAssignPen: (animalId: string, nextPenId: string) => void;
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
  pens,
  currentPenByAnimal,
  isLoading,
  onViewAnimal,
  onEditAnimal,
  onChangeStatus,
  onDeleteAnimal,
  onAssignPen,
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
    <div className="rounded-2xl border bg-farm-800/80 p-2 sm:p-3">
      <div className="space-y-2 md:hidden">
        {animals.map((animal) => {
          const currentPenId = currentPenByAnimal.get(animal.id) ?? "";

          return (
            <div
              key={animal.id}
              className="rounded-xl border border-farm-600/40 bg-farm-900/40 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewAnimal(animal.id)}
                  className="min-w-0 text-left"
                >
                  <div className="font-mono text-sm text-farm-lime">{animal.tagNumber}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <SpeciesBadge label={animal.speciesLabel} />
                    <span className="text-xs text-farm-muted">{animal.breedLabel}</span>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
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
                      <DropdownMenuSubTrigger>Assign to pen</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-farm-900">
                        <DropdownMenuItem
                          disabled={currentPenId === ""}
                          onClick={() => onAssignPen(animal.id, "")}
                        >
                          Unassigned
                        </DropdownMenuItem>
                        {pens.map((pen) => (
                          <DropdownMenuItem
                            key={pen.id}
                            disabled={currentPenId === pen.id}
                            onClick={() => onAssignPen(animal.id, pen.id)}
                          >
                            {pen.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
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
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-farm-600/40 bg-farm-950/40 p-2">
                  <div className="text-xs text-farm-muted">Current Weight</div>
                  <div>{formatNumber(animal.currentWeightKg, " kg")}</div>
                </div>
                <div className="rounded-md border border-farm-600/40 bg-farm-950/40 p-2">
                  <div className="text-xs text-farm-muted">ADG</div>
                  <div>{formatNumber(animal.averageDailyGainKg, " kg/d")}</div>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs">
                <AnimalStatusBadge status={animal.status} />
                <GrowthStatusBadge performance={animal.performance} />
              </div>
              <div className="mt-2 text-xs text-farm-muted">{animal.recommendation}</div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-275 text-sm">
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
                        <DropdownMenuSubTrigger>Assign to pen</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-farm-900">
                          <DropdownMenuItem
                            disabled={(currentPenByAnimal.get(animal.id) ?? "") === ""}
                            onClick={() => onAssignPen(animal.id, "")}
                          >
                            Unassigned
                          </DropdownMenuItem>
                          {pens.map((pen) => (
                            <DropdownMenuItem
                              key={pen.id}
                              disabled={(currentPenByAnimal.get(animal.id) ?? "") === pen.id}
                              onClick={() => onAssignPen(animal.id, pen.id)}
                            >
                              {pen.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
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
    </div>
  );
}
