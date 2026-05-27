import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useAnimalBreeds } from "../hooks/useAnimalBreeds";
import { useAnimalSpecies } from "../hooks/useAnimalSpecies";
import { useBulkWeightRows } from "../hooks/useBulkWeightRows";
import { usePens } from "../hooks/usePens";
import { useUpsertAnimalWeight } from "../hooks/useUpsertAnimalWeight";
import type { BulkWeightFilters, BulkWeightRow } from "../types/animal.types";

type Props = {
  farmId: string;
  initialDate: string;
  onClose: () => void;
};

type RowSaveState = "idle" | "dirty" | "saving" | "saved" | "error" | "warning";
type RowSaveSnapshot = {
  status: RowSaveState;
  message?: string | null;
};

const inputClass =
  "h-10 rounded-lg border border-farm-600/60 bg-farm-900/70 px-3 text-sm outline-none focus:border-farm-lime";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateWeight(value: string) {
  if (!value.trim()) return "blank";
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Weight must be greater than 0";
  if (parsed > 2000) return "Weight must be 2000kg or less";
  return null;
}

function weightWarning(value: number, previousWeight: number | null) {
  if (!previousWeight || previousWeight <= 0) return null;
  const change = Math.abs(value - previousWeight) / previousWeight;
  return change > 0.25 ? "Large change from previous weight" : null;
}

function SaveStatus({ status, message }: { status: RowSaveState; message?: string | null }) {
  const label = {
    idle: "",
    dirty: "Unsaved",
    saving: "Saving...",
    saved: "Saved",
    error: message || "Error",
    warning: message || "Saved with warning",
  }[status];

  if (!label) return <span className="text-xs text-farm-muted">-</span>;

  const color =
    status === "saved"
      ? "text-farm-success"
      : status === "error"
        ? "text-farm-danger"
        : status === "warning"
          ? "text-farm-warning"
          : "text-farm-muted";

  return <span className={`text-xs ${color}`}>{label}</span>;
}

function BulkWeightRowInput({
  farmId,
  recordedAt,
  row,
  onStatusChange,
}: {
  farmId: string;
  recordedAt: string;
  row: BulkWeightRow;
  onStatusChange: (animalId: string, snapshot: RowSaveSnapshot) => void;
}) {
  const { mutateAsync: upsertWeight } = useUpsertAnimalWeight();
  const initialValue = row.existingWeightKg === null ? "" : String(row.existingWeightKg);
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<RowSaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextValue = row.existingWeightKg === null ? "" : String(row.existingWeightKg);
    setValue(nextValue);
    setStatus("idle");
    setMessage(null);
    onStatusChange(row.animalId, { status: "idle" });
  }, [onStatusChange, row.animalId, row.existingWeightKg]);

  useEffect(() => {
    const validation = validateWeight(value);
    const normalizedInitial = initialValue;

    if (validation === "blank" || value === normalizedInitial) {
      return;
    }

    if (validation) {
      setStatus("error");
      setMessage(validation);
      onStatusChange(row.animalId, { status: "error", message: validation });
      return;
    }

    setStatus("dirty");
    setMessage(null);
    onStatusChange(row.animalId, { status: "dirty" });

    const timeout = window.setTimeout(async () => {
      const weightKg = Number(value);
      setStatus("saving");
      onStatusChange(row.animalId, { status: "saving" });

      try {
        await upsertWeight({
          farmId,
          animalId: row.animalId,
          recordedAt,
          weightKg,
          notes: "Bulk weighing entry",
        });

        const warning = weightWarning(weightKg, row.latestPreviousWeightKg);
        setStatus(warning ? "warning" : "saved");
        setMessage(warning);
        onStatusChange(row.animalId, {
          status: warning ? "warning" : "saved",
          message: warning,
        });
      } catch (error) {
        setStatus("error");
        const errorMessage = error instanceof Error ? error.message : "Save failed";
        setMessage(errorMessage);
        onStatusChange(row.animalId, { status: "error", message: errorMessage });
      }
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [
    farmId,
    initialValue,
    onStatusChange,
    recordedAt,
    row.animalId,
    row.latestPreviousWeightKg,
    value,
    upsertWeight,
  ]);

  return (
    <div className="flex items-center gap-2">
      <input
        className="h-9 w-32 rounded-md border border-farm-600/60 bg-farm-950/80 px-3 text-sm outline-none focus:border-farm-lime"
        inputMode="decimal"
        value={value}
        placeholder="kg"
        onChange={(event) => setValue(event.target.value)}
      />
      {status === "saving" && <span className="text-xs text-farm-muted">Saving...</span>}
      {message && <span className="text-xs text-farm-warning">{message}</span>}
    </div>
  );
}

export function BulkWeightEntryModal({ farmId, initialDate, onClose }: Props) {
  const [recordedAt, setRecordedAt] = useState(initialDate);
  const [filters, setFilters] = useState<BulkWeightFilters>({ status: "active" });
  const [statuses, setStatuses] = useState<Record<string, RowSaveSnapshot>>({});

  const speciesQuery = useAnimalSpecies();
  const breedsQuery = useAnimalBreeds(filters.speciesId);
  const pensQuery = usePens(farmId);
  const rowsQuery = useBulkWeightRows(farmId, recordedAt, filters);
  const rows = useMemo(() => rowsQuery.data ?? [], [rowsQuery.data]);

  const summary = useMemo(() => {
    const statusValues = Object.values(statuses).map((snapshot) => snapshot.status);
    return {
      shown: rows.length,
      entered: rows.filter((row) => row.existingWeightKg !== null || statuses[row.animalId]).length,
      saved: statusValues.filter((status) => status === "saved" || status === "warning").length,
      errors: statusValues.filter((status) => status === "error").length,
    };
  }, [rows, statuses]);

  const onStatusChange = useCallback((animalId: string, snapshot: RowSaveSnapshot) => {
    setStatuses((current) => ({ ...current, [animalId]: snapshot }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
      <div className="mx-auto flex h-full max-w-7xl flex-col rounded-xl border bg-farm-900 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-farm-600/40 p-5">
          <div>
            <h2 className="text-lg font-semibold">Record Weights</h2>
            <p className="mt-1 text-sm text-farm-muted">
              Enter weights by animal. Rows autosave 2 seconds after editing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-farm-600/60 text-farm-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-farm-600/40 p-4 lg:grid-cols-6">
          <input
            className={inputClass}
            type="date"
            max={todayIsoDate()}
            value={recordedAt}
            onChange={(event) => {
              setRecordedAt(event.target.value);
              setStatuses({});
            }}
          />
          <input
            className={`${inputClass} lg:col-span-2`}
            placeholder="Search tag, breed, pen..."
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
          />
          <select
            className={inputClass}
            value={filters.penId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, penId: event.target.value || undefined }))
            }
          >
            <option value="">All pens</option>
            {(pensQuery.data ?? []).map((pen) => (
              <option key={pen.id} value={pen.id}>
                {pen.name}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.speciesId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                speciesId: event.target.value || undefined,
                breedId: undefined,
              }))
            }
          >
            <option value="">All species</option>
            {(speciesQuery.data ?? []).map((species) => (
              <option key={species.id} value={species.id}>
                {species.name}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={filters.status ?? "all"}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: (event.target.value as BulkWeightFilters["status"]) || "all",
              }))
            }
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="sick">Sick</option>
            <option value="sold">Sold</option>
            <option value="removed">Removed</option>
            <option value="dead">Dead</option>
          </select>
          <select
            className={inputClass}
            value={filters.breedId ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, breedId: event.target.value || undefined }))
            }
          >
            <option value="">All breeds</option>
            {(breedsQuery.data ?? []).map((breed) => (
              <option key={breed.id} value={breed.id}>
                {breed.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 border-b border-farm-600/40 px-4 py-3 text-xs text-farm-muted">
          <span>{summary.shown} animals shown</span>
          <span>{summary.entered} weights entered</span>
          <span>{summary.saved} saved</span>
          <span>{summary.errors} errors</span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="sticky top-0 z-10 bg-farm-950 text-xs uppercase tracking-wider text-farm-muted">
              <tr>
                {[
                  "Tag",
                  "Species",
                  "Breed",
                  "Pen",
                  "Last Weight",
                  "Current Weight",
                  "Save Status",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.animalId} className="border-t border-farm-600/30 hover:bg-farm-800/60">
                  <td className="px-4 py-3 font-mono text-farm-lime">{row.tagNumber}</td>
                  <td className="px-4 py-3">{row.speciesLabel}</td>
                  <td className="px-4 py-3">{row.breedLabel}</td>
                  <td className="px-4 py-3 text-farm-muted">{row.penName ?? "-"}</td>
                  <td className="px-4 py-3 text-farm-muted">
                    {row.latestPreviousWeightKg === null
                      ? "-"
                      : `${row.latestPreviousWeightKg.toFixed(2)} kg (${row.latestPreviousWeightDate})`}
                  </td>
                  <td className="px-4 py-3">
                    <BulkWeightRowInput
                      farmId={farmId}
                      recordedAt={recordedAt}
                      row={row}
                      onStatusChange={onStatusChange}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <SaveStatus
                      status={statuses[row.animalId]?.status ?? "idle"}
                      message={statuses[row.animalId]?.message}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rowsQuery.isLoading && (
            <div className="p-5 text-sm text-farm-muted">Loading animals...</div>
          )}
          {!rowsQuery.isLoading && rows.length === 0 && (
            <div className="p-5 text-sm text-farm-muted">
              No animals match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
