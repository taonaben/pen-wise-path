import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CircleDollarSign,
  Scale,
  SlidersHorizontal,
  Users,
  Wheat,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
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
  const isMobile = useIsMobile();
  const [recordOpen, setRecordOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard
          title="Feedings Today"
          value={String(summary.todayEvents)}
          icon={<CalendarDays className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Total Feed Used This Week"
          value={formatKg(summary.totalFeedUsedWeekKg)}
          icon={<Scale className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Feed Cost This Week"
          value={formatMoney(summary.feedCostWeek)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Animals Fed This Week"
          value={String(summary.animalsFedWeek)}
          icon={<Users className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Most Used Feed"
          value={summary.mostUsedFeed}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
      </div>

      {isMobile && (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 border-farm-600/50 bg-farm-800/70 text-foreground hover:bg-farm-700/60"
          onClick={() => setShowMobileFilters((current) => !current)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      )}

      {(!isMobile || showMobileFilters) && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-farm-800/80 p-3 sm:grid-cols-3 sm:p-4">
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
          <select
            className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground sm:col-span-3"
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value as "" | FeedingMethod)}
          >
            <option value="" className="bg-farm-900 text-foreground">
              All scopes
            </option>
            <option value="individual" className="bg-farm-900 text-foreground">
              Individual animal
            </option>
            <option value="pen_group" className="bg-farm-900 text-foreground">
              Pen / group
            </option>
          </select>
        </div>
      )}

      {isMobile ? (
        <Accordion
          type="multiple"
          defaultValue={["feeding-events"]}
          className="rounded-xl border border-farm-600/35 bg-farm-800/55 px-3"
        >
          <AccordionItem value="feeding-events" className="border-farm-600/30">
            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline data-[state=open]:text-farm-lime [&[data-state=open]>svg]:text-farm-lime">
              Feeding Events
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-farm-600/35 bg-farm-900/45 p-3"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {event.feedTypeName}
                        </div>
                        <div className="text-xs text-farm-muted">
                          {new Date(event.date).toLocaleDateString()} • {event.target}
                        </div>
                      </div>
                      <span className="rounded-full bg-farm-700/50 px-2 py-1 text-xs capitalize text-foreground">
                        {event.scope.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                          Quantity
                        </div>
                        <div className="font-medium text-foreground">
                          {formatKg(event.quantityKg)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                          Animals fed
                        </div>
                        <div className="font-medium text-foreground">{event.animalsFed}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                          Total cost
                        </div>
                        <div className="font-medium text-foreground">
                          {formatMoney(event.totalCost)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                          Allocation
                        </div>
                        <div className="font-medium capitalize text-foreground">
                          {event.allocationMethod.replaceAll("_", " ")}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[11px] uppercase tracking-wide text-farm-muted">
                          Recorded by
                        </div>
                        <div className="font-medium text-foreground">{event.recordedBy ?? "-"}</div>
                      </div>
                    </div>
                  </div>
                ))}

                {eventsQuery.isLoading && (
                  <div className="p-2 text-sm text-farm-muted">Loading feeding events...</div>
                )}
                {!eventsQuery.isLoading && events.length === 0 && (
                  <div className="p-2 text-sm text-farm-muted">No feeding events found.</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
          <table className="w-full min-w-245 text-sm">
            <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Date</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Feed Type</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Scope</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Target</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Quantity</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Animals Fed</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Total Cost</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Allocation</th>
                <th className="px-3 py-2 text-left font-medium sm:px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-farm-600/30">
                  <td className="px-3 py-2 sm:px-4">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-medium sm:px-4">{event.feedTypeName}</td>
                  <td className="px-3 py-2 capitalize sm:px-4">
                    {event.scope.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-2 text-farm-muted sm:px-4">{event.target}</td>
                  <td className="px-3 py-2 sm:px-4">{formatKg(event.quantityKg)}</td>
                  <td className="px-3 py-2 sm:px-4">{event.animalsFed}</td>
                  <td className="px-3 py-2 sm:px-4">{formatMoney(event.totalCost)}</td>
                  <td className="px-3 py-2 capitalize sm:px-4">
                    {event.allocationMethod.replaceAll("_", " ")}
                  </td>
                  <td className="px-3 py-2 text-farm-muted sm:px-4">{event.recordedBy ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {eventsQuery.isLoading && (
            <div className="p-4 text-sm text-farm-muted">Loading feeding events...</div>
          )}
          {!eventsQuery.isLoading && events.length === 0 && (
            <div className="p-4 text-sm text-farm-muted">No feeding events found.</div>
          )}
        </div>
      )}
    </div>
  );
}
