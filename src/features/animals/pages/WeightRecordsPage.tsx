import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { BulkWeightEntryModal } from "../components/BulkWeightEntryModal";
import { useBulkWeightRows } from "../hooks/useBulkWeightRows";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function WeightRecordsPage() {
  const { currentFarm } = useCurrentFarm();
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const rowsQuery = useBulkWeightRows(currentFarm.id, selectedDate, { status: "all" });
  const recordedRows = (rowsQuery.data ?? []).filter((row) => row.existingWeightKg !== null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <PageHeader
          title="Weight Records"
          description="Review and record animal weighing sessions."
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-farm-lime px-4 text-sm font-medium text-farm-950"
        >
          <Plus className="h-4 w-4" />
          Record Weights
        </button>
      </div>

      <div className="rounded-xl border bg-farm-800/80 p-4">
        <label className="block max-w-xs space-y-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-farm-muted">
            Weighing date
          </span>
          <input
            className="h-10 w-full rounded-lg border border-farm-600/60 bg-farm-900/70 px-3 text-sm outline-none focus:border-farm-lime"
            type="date"
            max={todayIsoDate()}
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              {["Tag", "Species", "Breed", "Pen", "Weight", "Previous Weight"].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recordedRows.map((row) => (
              <tr key={row.animalId} className="border-t border-farm-600/30">
                <td className="px-5 py-3 font-mono text-farm-lime">{row.tagNumber}</td>
                <td className="px-5 py-3">{row.speciesLabel}</td>
                <td className="px-5 py-3">{row.breedLabel}</td>
                <td className="px-5 py-3 text-farm-muted">{row.penName ?? "-"}</td>
                <td className="px-5 py-3">{row.existingWeightKg?.toFixed(2)} kg</td>
                <td className="px-5 py-3 text-farm-muted">
                  {row.latestPreviousWeightKg === null
                    ? "-"
                    : `${row.latestPreviousWeightKg.toFixed(2)} kg (${row.latestPreviousWeightDate})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rowsQuery.isLoading && (
          <div className="p-5 text-sm text-farm-muted">Loading weight records...</div>
        )}
        {!rowsQuery.isLoading && recordedRows.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">
            No weights recorded for {selectedDate}. Use Record Weights to start a weighing session.
          </div>
        )}
      </div>

      {isModalOpen && (
        <BulkWeightEntryModal
          farmId={currentFarm.id}
          initialDate={selectedDate}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
