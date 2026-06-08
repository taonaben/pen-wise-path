import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
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

function SaveStatus({
  status,
  message,
  hasRecordedValue,
}: {
  status: RowSaveState;
  message?: string | null;
  hasRecordedValue?: boolean;
}) {
  const label = {
    idle: hasRecordedValue ? "Recorded" : "",
    dirty: "Unsaved",
    saving: "Saving...",
    saved: "Recorded",
    error: message || "Error",
    warning: message || "Recorded",
  }[status];

  if (!label) return <span className="text-xs text-farm-muted" />;

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

function statusChip(snapshot: RowSaveSnapshot | undefined) {
  const status = snapshot?.status ?? "idle";

  if (status === "saved" || status === "warning") {
    return {
      label: status === "warning" ? "Recorded" : "Recorded",
      className: "border-farm-success/50 bg-farm-success/15 text-farm-success",
    };
  }

  if (status === "saving") {
    return {
      label: "Saving...",
      className: "border-farm-600/50 bg-farm-900/60 text-farm-muted",
    };
  }

  if (status === "error") {
    return {
      label: "Error",
      className: "border-farm-danger/50 bg-farm-danger/15 text-farm-danger",
    };
  }

  if (status === "dirty") {
    return {
      label: "Unsaved",
      className: "border-farm-warning/50 bg-farm-warning/15 text-farm-warning",
    };
  }

  return null;
}

function BulkWeightRowInput({
  farmId,
  recordedAt,
  row,
  onStatusChange,
  inputRef,
  onEnterNext,
  onImmediateSave,
}: {
  farmId: string;
  recordedAt: string;
  row: BulkWeightRow;
  onStatusChange: (animalId: string, snapshot: RowSaveSnapshot) => void;
  inputRef?: (element: HTMLInputElement | null) => void;
  onEnterNext?: () => void;
  onImmediateSave?: () => void;
}) {
  const { mutateAsync: upsertWeight } = useUpsertAnimalWeight();
  const initialValue = row.existingWeightKg === null ? "" : String(row.existingWeightKg);
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<RowSaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const executeSave = useCallback(
    async (nextValue: string) => {
      const validation = validateWeight(nextValue);
      if (validation === "blank" || nextValue === initialValue) {
        return;
      }

      if (validation) {
        setStatus("error");
        setMessage(validation);
        onStatusChange(row.animalId, { status: "error", message: validation });
        return;
      }

      const weightKg = Number(nextValue);
      setStatus("saving");
      setMessage(null);
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
    },
    [
      farmId,
      initialValue,
      onStatusChange,
      recordedAt,
      row.animalId,
      row.latestPreviousWeightKg,
      upsertWeight,
    ],
  );

  useEffect(() => {
    const nextValue = row.existingWeightKg === null ? "" : String(row.existingWeightKg);
    setValue(nextValue);
    setStatus("idle");
    setMessage(null);
    onStatusChange(row.animalId, { status: "idle" });

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [onStatusChange, row.animalId, row.existingWeightKg]);

  useEffect(() => {
    const validation = validateWeight(value);
    if (validation === "blank" || value === initialValue) {
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

    timeoutRef.current = window.setTimeout(() => {
      void executeSave(value);
      timeoutRef.current = null;
    }, 2000);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [executeSave, initialValue, onStatusChange, row.animalId, value]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        className="h-9 w-28 rounded-md border border-farm-600/60 bg-farm-950/80 px-3 text-sm outline-none focus:border-farm-lime sm:w-32"
        inputMode="decimal"
        value={value}
        placeholder="kg"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (timeoutRef.current !== null) {
              window.clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            void executeSave(value);
            onImmediateSave?.();
            onEnterNext?.();
          }
        }}
      />
      {status === "saving" && <span className="text-xs text-farm-muted">Saving...</span>}
      {message && <span className="text-xs text-farm-warning">{message}</span>}
    </div>
  );
}

export function BulkWeightEntryModal({ farmId, initialDate, onClose }: Props) {
  const isMobile = useIsMobile();
  const [recordedAt, setRecordedAt] = useState(initialDate);
  const [filters, setFilters] = useState<BulkWeightFilters>({ status: "active" });
  const [statuses, setStatuses] = useState<Record<string, RowSaveSnapshot>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const speciesQuery = useAnimalSpecies();
  const breedsQuery = useAnimalBreeds(filters.speciesId);
  const pensQuery = usePens(farmId);
  const rowsQuery = useBulkWeightRows(farmId, recordedAt, filters);
  const rows = useMemo(() => rowsQuery.data ?? [], [rowsQuery.data]);

  const summary = useMemo(() => {
    const statusValues = rows
      .map((row) => statuses[row.animalId]?.status)
      .filter((status): status is RowSaveState => Boolean(status));
    const unsaved = statusValues.filter(
      (status) => status === "dirty" || status === "saving" || status === "error",
    ).length;

    return {
      shown: rows.length,
      entered: rows.filter((row) => row.existingWeightKg !== null || statuses[row.animalId]).length,
      saved: statusValues.filter((status) => status === "saved" || status === "warning").length,
      errors: statusValues.filter((status) => status === "error").length,
      unsaved,
    };
  }, [rows, statuses]);

  const onStatusChange = useCallback((animalId: string, snapshot: RowSaveSnapshot) => {
    setStatuses((current) => ({ ...current, [animalId]: snapshot }));
  }, []);

  const focusNextRow = useCallback(
    (animalId: string) => {
      const index = rows.findIndex((row) => row.animalId === animalId);
      if (index < 0 || index === rows.length - 1) return;
      const nextId = rows[index + 1]!.animalId;
      inputRefs.current[nextId]?.focus();
    },
    [rows],
  );

  const onSaveAll = useCallback(() => {
    const editable = rows.filter((row) => {
      const snapshot = statuses[row.animalId];
      return snapshot?.status === "dirty" || snapshot?.status === "error";
    });

    if (editable.length === 0) {
      onClose();
      return;
    }

    for (const row of editable) {
      inputRefs.current[row.animalId]?.focus();
      inputRefs.current[row.animalId]?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    }
    onClose();
  }, [onClose, rows, statuses]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-2 sm:p-4">
      <div className="mx-auto flex h-full max-w-7xl flex-col rounded-xl border bg-farm-900 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-farm-600/40 p-4 sm:gap-4 sm:p-5">
          <div>
            <h2 className="text-base font-semibold sm:text-lg">Record Weights</h2>
            <p className="mt-1 text-xs text-farm-muted sm:text-sm">
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

        <div className="grid grid-cols-1 gap-3 border-b border-farm-600/40 p-4 sm:grid-cols-2 xl:grid-cols-6">
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
            className={`${inputClass} sm:col-span-2 xl:col-span-2`}
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

          {isMobile && (
            <Button
              type="button"
              variant="outline"
              className="h-10 justify-center gap-2 border-farm-600/50 bg-farm-800/60 text-foreground hover:bg-farm-700/60 sm:col-span-2"
              onClick={() => setShowAdvancedFilters((current) => !current)}
            >
              <Filter className="h-4 w-4" />
              {showAdvancedFilters ? "Hide Filters" : "Filters"}
            </Button>
          )}

          {(!isMobile || showAdvancedFilters) && (
            <>
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
                  setFilters((current) => ({
                    ...current,
                    breedId: event.target.value || undefined,
                  }))
                }
              >
                <option value="">All breeds</option>
                {(breedsQuery.data ?? []).map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-farm-600/40 px-4 py-3 text-xs text-farm-muted">
          <span className="rounded-full border border-farm-600/40 bg-farm-950/60 px-2 py-1">
            {summary.shown} animals shown
          </span>
          <span className="rounded-full border border-farm-600/40 bg-farm-950/60 px-2 py-1">
            {summary.entered} weights entered
          </span>
          <span className="rounded-full border border-farm-600/40 bg-farm-950/60 px-2 py-1">
            {summary.saved} saved
          </span>
          <span className="rounded-full border border-farm-600/40 bg-farm-950/60 px-2 py-1">
            {summary.errors} errors
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="space-y-2 p-3 md:hidden">
            {rows.map((row) => {
              const chip = statusChip(statuses[row.animalId]);

              return (
                <div
                  key={row.animalId}
                  className="rounded-lg border border-farm-600/40 bg-farm-900/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-sm text-farm-lime">{row.tagNumber}</div>
                      <div className="text-xs text-farm-muted">
                        {row.speciesLabel} • {row.breedLabel}
                      </div>
                    </div>
                    {chip ? (
                      <span
                        className={`rounded-full border px-2 py-1 text-[11px] font-medium ${chip.className}`}
                      >
                        {chip.label}
                      </span>
                    ) : row.existingWeightKg !== null ? (
                      <span className="rounded-full border border-farm-success/40 bg-farm-success/10 px-2 py-1 text-[11px] font-medium text-farm-success">
                        Recorded
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-farm-muted">Pen: {row.penName ?? "-"}</div>
                  <div className="mt-1 text-xs text-farm-muted">
                    Last:{" "}
                    {row.latestPreviousWeightKg === null
                      ? "-"
                      : `${row.latestPreviousWeightKg.toFixed(2)} kg (${row.latestPreviousWeightDate})`}
                  </div>
                  <div className="mt-3">
                    <BulkWeightRowInput
                      farmId={farmId}
                      recordedAt={recordedAt}
                      row={row}
                      onStatusChange={onStatusChange}
                      inputRef={(element) => {
                        inputRefs.current[row.animalId] = element;
                      }}
                      onEnterNext={() => focusNextRow(row.animalId)}
                      onImmediateSave={() => {
                        setStatuses((current) => ({
                          ...current,
                          [row.animalId]: { status: "saving" },
                        }));
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <table className="w-full min-w-245 text-sm">
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
                  <tr
                    key={row.animalId}
                    className="border-t border-farm-600/30 hover:bg-farm-800/60"
                  >
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
                        inputRef={(element) => {
                          inputRefs.current[row.animalId] = element;
                        }}
                        onEnterNext={() => focusNextRow(row.animalId)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <SaveStatus
                        status={statuses[row.animalId]?.status ?? "idle"}
                        message={statuses[row.animalId]?.message}
                        hasRecordedValue={row.existingWeightKg !== null}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rowsQuery.isLoading && (
            <div className="p-5 text-sm text-farm-muted">Loading animals...</div>
          )}
          {!rowsQuery.isLoading && rows.length === 0 && (
            <div className="p-5 text-sm text-farm-muted">
              No animals match the selected filters.
            </div>
          )}
        </div>

        <div
          className={`z-20 flex items-center justify-between gap-3 border-t border-farm-600/40 px-4 py-3 ${
            isMobile ? "sticky bottom-0 bg-farm-950/95 backdrop-blur-sm" : "bg-farm-900"
          }`}
        >
          <div className="text-xs text-farm-muted">
            {summary.unsaved} unsaved • {summary.saved} saved
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90"
              onClick={onSaveAll}
            >
              Save All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
