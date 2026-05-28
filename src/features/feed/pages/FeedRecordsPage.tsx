import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimals } from "@/features/animals/hooks/useAnimals";
import { usePens } from "@/features/animals/hooks/usePens";
import type { AnimalFilters, FeedingMethod } from "@/features/animals/types/animal.types";
import { feedTypeService } from "../services/feedTypeService";
import { useFeedingEventActions, useFeedingEvents } from "../hooks/useFeedingEvents";

const defaultFilters: AnimalFilters = {
  status: "all",
  performance: "all",
  sex: "all",
};

type RecordFormState = {
  feedTypeId: string;
  feedingMethod: FeedingMethod;
  allocationMethod: "equal_per_animal" | "by_weight_percentage" | "manual";
  animalId: string;
  penId: string;
  quantityKg: string;
  feedingDate: string;
  notes: string;
};

const emptyForm: RecordFormState = {
  feedTypeId: "",
  feedingMethod: "individual",
  allocationMethod: "equal_per_animal",
  animalId: "",
  penId: "",
  quantityKg: "",
  feedingDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

function formatKg(value: number) {
  return `${value.toFixed(2)} kg`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function startOfWeekIsoDate() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day + 6) % 7;
  now.setDate(now.getDate() - diff);
  return now.toISOString().slice(0, 10);
}

export function FeedRecordsPage() {
  const { currentFarm } = useCurrentFarm();
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordForm, setRecordForm] = useState<RecordFormState>(emptyForm);

  const [dateFrom, setDateFrom] = useState(startOfWeekIsoDate());
  const [dateTo, setDateTo] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"" | FeedingMethod>("");

  const feedTypesQuery = useQuery({
    queryKey: ["feed-types-for-records", currentFarm.id],
    queryFn: () => feedTypeService.listByFarm(currentFarm.id),
  });
  const animalsQuery = useAnimals(currentFarm.id, defaultFilters);
  const pensQuery = usePens(currentFarm.id);

  const eventsQuery = useFeedingEvents(currentFarm.id, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    feedTypeId: feedTypeFilter || undefined,
    feedingMethod: scopeFilter || undefined,
  });

  const actions = useFeedingEventActions(currentFarm.id);

  const events = eventsQuery.data ?? [];

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = startOfWeekIsoDate();

    const todayEvents = events.filter((event) => event.date === today).length;
    const weekEvents = events.filter((event) => event.date >= weekStart);
    const totalFeedUsedWeekKg = weekEvents.reduce((sum, event) => sum + event.quantityKg, 0);
    const feedCostWeek = weekEvents.reduce((sum, event) => sum + event.totalCost, 0);
    const animalsFedWeek = weekEvents.reduce((sum, event) => sum + event.animalsFed, 0);

    const feedUsage = new Map<string, number>();
    for (const event of weekEvents) {
      feedUsage.set(
        event.feedTypeName,
        (feedUsage.get(event.feedTypeName) ?? 0) + event.quantityKg,
      );
    }
    const mostUsedFeed = [...feedUsage.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return {
      todayEvents,
      totalFeedUsedWeekKg,
      feedCostWeek,
      animalsFedWeek,
      mostUsedFeed,
    };
  }, [events]);

  const onRecordFeeding = async () => {
    const quantityKg = Number(recordForm.quantityKg);
    if (!recordForm.feedTypeId) {
      toast.error("Select a feed type");
      return;
    }

    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (recordForm.feedingMethod === "individual" && !recordForm.animalId) {
      toast.error("Select an animal for individual feeding");
      return;
    }

    if (recordForm.feedingMethod === "pen_group" && !recordForm.penId) {
      toast.error("Select a pen for pen feeding");
      return;
    }

    try {
      await actions.recordFeedingEvent.mutateAsync({
        farmId: currentFarm.id,
        feedTypeId: recordForm.feedTypeId,
        quantityKg,
        feedingDate: recordForm.feedingDate,
        feedingMethod: recordForm.feedingMethod,
        allocationMethod:
          recordForm.feedingMethod === "individual"
            ? "equal_per_animal"
            : recordForm.allocationMethod,
        animalIds: recordForm.feedingMethod === "individual" ? [recordForm.animalId] : undefined,
        penId: recordForm.feedingMethod === "pen_group" ? recordForm.penId : null,
        notes: recordForm.notes || null,
      });

      toast.success("Feeding event recorded");
      setRecordForm(emptyForm);
      setRecordOpen(false);
    } catch {
      toast.error("Could not record feeding event");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feed Records"
        description="Feeding history by animal and pen, sourced from feeding events."
        action={
          <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90">
                Record Feeding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Feeding</DialogTitle>
                <DialogDescription>
                  Create a feeding event and allocate feed to animals based on scope.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                  value={recordForm.feedTypeId}
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, feedTypeId: event.target.value }))
                  }
                >
                  <option value="" className="bg-farm-900 text-foreground">
                    Select feed type
                  </option>
                  {(feedTypesQuery.data ?? []).map((feedType) => (
                    <option
                      key={feedType.id}
                      value={feedType.id}
                      className="bg-farm-900 text-foreground"
                    >
                      {feedType.name}
                    </option>
                  ))}
                </select>

                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                  value={recordForm.feedingMethod}
                  onChange={(event) =>
                    setRecordForm((current) => ({
                      ...current,
                      feedingMethod: event.target.value as FeedingMethod,
                      animalId: "",
                      penId: "",
                    }))
                  }
                >
                  <option value="individual" className="bg-farm-900 text-foreground">
                    Individual animal
                  </option>
                  <option value="pen_group" className="bg-farm-900 text-foreground">
                    Pen / group
                  </option>
                </select>

                {recordForm.feedingMethod === "individual" && (
                  <select
                    className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                    value={recordForm.animalId}
                    onChange={(event) =>
                      setRecordForm((current) => ({ ...current, animalId: event.target.value }))
                    }
                  >
                    <option value="" className="bg-farm-900 text-foreground">
                      Select animal
                    </option>
                    {(animalsQuery.data?.animals ?? []).map((animal) => (
                      <option
                        key={animal.id}
                        value={animal.id}
                        className="bg-farm-900 text-foreground"
                      >
                        {animal.tagNumber}
                      </option>
                    ))}
                  </select>
                )}

                {recordForm.feedingMethod === "pen_group" && (
                  <>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                      value={recordForm.penId}
                      onChange={(event) =>
                        setRecordForm((current) => ({ ...current, penId: event.target.value }))
                      }
                    >
                      <option value="" className="bg-farm-900 text-foreground">
                        Select pen
                      </option>
                      {(pensQuery.data ?? []).map((pen) => (
                        <option key={pen.id} value={pen.id} className="bg-farm-900 text-foreground">
                          {pen.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
                      value={recordForm.allocationMethod}
                      onChange={(event) =>
                        setRecordForm((current) => ({
                          ...current,
                          allocationMethod: event.target
                            .value as RecordFormState["allocationMethod"],
                        }))
                      }
                    >
                      <option value="equal_per_animal" className="bg-farm-900 text-foreground">
                        Equal split
                      </option>
                      <option value="by_weight_percentage" className="bg-farm-900 text-foreground">
                        Weight-based
                      </option>
                    </select>
                  </>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Quantity (kg)"
                    value={recordForm.quantityKg}
                    onChange={(event) =>
                      setRecordForm((current) => ({ ...current, quantityKg: event.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    value={recordForm.feedingDate}
                    onChange={(event) =>
                      setRecordForm((current) => ({ ...current, feedingDate: event.target.value }))
                    }
                  />
                </div>

                <Input
                  placeholder="Notes"
                  value={recordForm.notes}
                  onChange={(event) =>
                    setRecordForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={onRecordFeeding}
                  disabled={actions.recordFeedingEvent.isPending}
                >
                  {actions.recordFeedingEvent.isPending ? "Saving..." : "Save Feeding Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Feedings Today</div>
          <div className="mt-2 text-xl font-semibold">{summary.todayEvents}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Total Feed Used This Week</div>
          <div className="mt-2 text-xl font-semibold">{formatKg(summary.totalFeedUsedWeekKg)}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Feed Cost This Week</div>
          <div className="mt-2 text-xl font-semibold">{formatMoney(summary.feedCostWeek)}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Animals Fed This Week</div>
          <div className="mt-2 text-xl font-semibold">{summary.animalsFedWeek}</div>
        </div>
        <div className="rounded-xl border bg-farm-800/80 p-4">
          <div className="text-xs text-farm-muted">Most Used Feed</div>
          <div className="mt-2 text-xl font-semibold">{summary.mostUsedFeed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          placeholder="To"
        />
        <select
          className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground"
          value={feedTypeFilter}
          onChange={(event) => setFeedTypeFilter(event.target.value)}
        >
          <option value="" className="bg-farm-900 text-foreground">
            All feed types
          </option>
          {(feedTypesQuery.data ?? []).map((feedType) => (
            <option key={feedType.id} value={feedType.id} className="bg-farm-900 text-foreground">
              {feedType.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
        <table className="w-full min-w-245 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Date</th>
              <th className="px-5 py-3 text-left font-medium">Feed Type</th>
              <th className="px-5 py-3 text-left font-medium">Scope</th>
              <th className="px-5 py-3 text-left font-medium">Target</th>
              <th className="px-5 py-3 text-left font-medium">Quantity</th>
              <th className="px-5 py-3 text-left font-medium">Animals Fed</th>
              <th className="px-5 py-3 text-left font-medium">Total Cost</th>
              <th className="px-5 py-3 text-left font-medium">Allocation</th>
              <th className="px-5 py-3 text-left font-medium">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-farm-600/30">
                <td className="px-5 py-3">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-5 py-3 font-medium">{event.feedTypeName}</td>
                <td className="px-5 py-3 capitalize">{event.scope.replaceAll("_", " ")}</td>
                <td className="px-5 py-3 text-farm-muted">{event.target}</td>
                <td className="px-5 py-3">{formatKg(event.quantityKg)}</td>
                <td className="px-5 py-3">{event.animalsFed}</td>
                <td className="px-5 py-3">{formatMoney(event.totalCost)}</td>
                <td className="px-5 py-3 capitalize">
                  {event.allocationMethod.replaceAll("_", " ")}
                </td>
                <td className="px-5 py-3 text-farm-muted">{event.recordedBy ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {eventsQuery.isLoading && (
          <div className="p-5 text-sm text-farm-muted">Loading feeding events...</div>
        )}
        {!eventsQuery.isLoading && events.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">No feeding events found.</div>
        )}
      </div>
    </div>
  );
}
