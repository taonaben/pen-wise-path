import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Scale,
  SlidersHorizontal,
  Wheat,
} from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { StatCard } from "@/shared/components/ui/StatCard";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { useFeedInventory, useFeedInventoryActions } from "../hooks/useFeedInventory";
import type { FeedCategory } from "../types/feed.types";

const feedCategories: FeedCategory[] = [
  "concentrate",
  "roughage",
  "silage",
  "hay",
  "supplement",
  "mineral",
  "mixed_ration",
  "other",
];

type FeedTypeFormState = {
  name: string;
  speciesId: string;
  category: FeedCategory;
  costPerKg: string;
  proteinPercentage: string;
  dryMatterPercentage: string;
  lowStockThresholdKg: string;
};

type BatchFormState = {
  feedTypeId: string;
  batchNumber: string;
  supplierName: string;
  purchaseDate: string;
  expiryDate: string;
  initialQuantityKg: string;
  unitCost: string;
  storageLocation: string;
};

type FeedTypeFilterState = {
  search: string;
  category: FeedCategory | "all";
  speciesId: string;
  stockStatus: "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon";
};

const emptyFeedTypeForm: FeedTypeFormState = {
  name: "",
  speciesId: "",
  category: "other",
  costPerKg: "",
  proteinPercentage: "",
  dryMatterPercentage: "",
  lowStockThresholdKg: "0",
};

const emptyBatchForm: BatchFormState = {
  feedTypeId: "",
  batchNumber: "",
  supplierName: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  initialQuantityKg: "",
  unitCost: "",
  storageLocation: "",
};

const emptyFilters: FeedTypeFilterState = {
  search: "",
  category: "all",
  speciesId: "all",
  stockStatus: "all",
};

function formatKg(value: number) {
  return `${value.toFixed(2)} kg`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export function FeedTypesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const inventoryQuery = useFeedInventory(currentFarm.id);
  const actions = useFeedInventoryActions(currentFarm.id);

  const [feedTypeForm, setFeedTypeForm] = useState<FeedTypeFormState>(emptyFeedTypeForm);
  const [batchForm, setBatchForm] = useState<BatchFormState>(emptyBatchForm);
  const [feedTypeDialogOpen, setFeedTypeDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FeedTypeFilterState>(emptyFilters);

  const inventory = inventoryQuery.data;
  const rows = useMemo(() => inventory?.rows ?? [], [inventory?.rows]);

  const speciesLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const species of speciesQuery.data ?? []) {
      map.set(species.id, species.name);
    }
    return map;
  }, [speciesQuery.data]);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const feedType = row.feedType;
      const speciesLabel = feedType.species_id ? speciesLabelById.get(feedType.species_id) : "All";
      const matchesSearch =
        !search ||
        feedType.name.toLowerCase().includes(search) ||
        feedType.category.replaceAll("_", " ").toLowerCase().includes(search) ||
        (speciesLabel ?? "").toLowerCase().includes(search);

      const matchesCategory = filters.category === "all" || feedType.category === filters.category;
      const matchesSpecies =
        filters.speciesId === "all" ||
        (filters.speciesId === "unassigned" && !feedType.species_id) ||
        feedType.species_id === filters.speciesId;

      const matchesStockStatus =
        filters.stockStatus === "all" ||
        (filters.stockStatus === "in_stock" && row.stockOnHandKg > 0 && !row.lowStock) ||
        (filters.stockStatus === "low_stock" && row.stockOnHandKg > 0 && row.lowStock) ||
        (filters.stockStatus === "out_of_stock" && row.stockOnHandKg <= 0) ||
        (filters.stockStatus === "expiring_soon" && row.expiringSoonBatches > 0);

      return matchesSearch && matchesCategory && matchesSpecies && matchesStockStatus;
    });
  }, [filters, rows, speciesLabelById]);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.speciesId !== "all" ||
    filters.stockStatus !== "all";

  const openBatchDialog = (feedTypeId: string) => {
    setBatchForm((current) => ({ ...current, feedTypeId }));
    setBatchDialogOpen(true);
  };

  const onCreateFeedType = async () => {
    if (!feedTypeForm.name.trim()) {
      toast.error("Feed name is required");
      return;
    }

    const costPerKg = Number(feedTypeForm.costPerKg);
    if (!Number.isFinite(costPerKg) || costPerKg < 0) {
      toast.error("Cost per kg must be a valid non-negative number");
      return;
    }

    try {
      await actions.createFeedType.mutateAsync({
        farmId: currentFarm.id,
        speciesId: feedTypeForm.speciesId || null,
        name: feedTypeForm.name,
        category: feedTypeForm.category,
        costPerKg,
        proteinPercentage:
          feedTypeForm.proteinPercentage.trim() === ""
            ? null
            : Number(feedTypeForm.proteinPercentage),
        dryMatterPercentage:
          feedTypeForm.dryMatterPercentage.trim() === ""
            ? null
            : Number(feedTypeForm.dryMatterPercentage),
        lowStockThresholdKg: Number(feedTypeForm.lowStockThresholdKg || 0),
      });

      toast.success("Feed type created");
      setFeedTypeForm(emptyFeedTypeForm);
      setFeedTypeDialogOpen(false);
    } catch {
      toast.error("Could not create feed type");
    }
  };

  const onCreateBatch = async () => {
    if (!batchForm.feedTypeId) {
      toast.error("Select a feed type first");
      return;
    }

    const initialQuantityKg = Number(batchForm.initialQuantityKg);
    const unitCost = Number(batchForm.unitCost);

    if (!Number.isFinite(initialQuantityKg) || initialQuantityKg <= 0) {
      toast.error("Batch quantity must be greater than 0");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      toast.error("Unit cost must be a valid non-negative number");
      return;
    }

    try {
      await actions.createFeedBatch.mutateAsync({
        farmId: currentFarm.id,
        feedTypeId: batchForm.feedTypeId,
        batchNumber: batchForm.batchNumber || null,
        supplierName: batchForm.supplierName || null,
        purchaseDate: batchForm.purchaseDate,
        expiryDate: batchForm.expiryDate || null,
        initialQuantityKg,
        unitCost,
        storageLocation: batchForm.storageLocation || null,
      });

      toast.success("Feed batch added");
      setBatchForm(emptyBatchForm);
      setBatchDialogOpen(false);
    } catch {
      toast.error("Could not add feed batch");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Feed Types"
        description="Manage feed catalogue, nutrition profiles, and stock levels."
        action={
          <Dialog open={feedTypeDialogOpen} onOpenChange={setFeedTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="bg-farm-lime text-farm-950 hover:bg-farm-lime/90">
                Add Feed Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Feed Type</DialogTitle>
                <DialogDescription>
                  Create a feed master record used for nutrition and inventory.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Input
                  value={feedTypeForm.name}
                  onChange={(event) =>
                    setFeedTypeForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Feed name"
                />

                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={feedTypeForm.speciesId}
                  onChange={(event) =>
                    setFeedTypeForm((current) => ({ ...current, speciesId: event.target.value }))
                  }
                >
                  <option value="" className="bg-farm-900 text-foreground">
                    All species
                  </option>
                  {(speciesQuery.data ?? []).map((species) => (
                    <option
                      key={species.id}
                      value={species.id}
                      className="bg-farm-900 text-foreground"
                    >
                      {species.name}
                    </option>
                  ))}
                </select>

                <select
                  className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={feedTypeForm.category}
                  onChange={(event) =>
                    setFeedTypeForm((current) => ({
                      ...current,
                      category: event.target.value as FeedCategory,
                    }))
                  }
                >
                  {feedCategories.map((category) => (
                    <option key={category} value={category} className="bg-farm-900 text-foreground">
                      {category.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <Input
                  value={feedTypeForm.costPerKg}
                  onChange={(event) =>
                    setFeedTypeForm((current) => ({ ...current, costPerKg: event.target.value }))
                  }
                  placeholder="Cost per kg"
                  type="number"
                  min={0}
                  step="0.01"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    value={feedTypeForm.proteinPercentage}
                    onChange={(event) =>
                      setFeedTypeForm((current) => ({
                        ...current,
                        proteinPercentage: event.target.value,
                      }))
                    }
                    placeholder="Protein %"
                    type="number"
                    min={0}
                    step="0.01"
                  />
                  <Input
                    value={feedTypeForm.dryMatterPercentage}
                    onChange={(event) =>
                      setFeedTypeForm((current) => ({
                        ...current,
                        dryMatterPercentage: event.target.value,
                      }))
                    }
                    placeholder="Dry matter %"
                    type="number"
                    min={0}
                    step="0.01"
                  />
                  <Input
                    value={feedTypeForm.lowStockThresholdKg}
                    onChange={(event) =>
                      setFeedTypeForm((current) => ({
                        ...current,
                        lowStockThresholdKg: event.target.value,
                      }))
                    }
                    placeholder="Low stock threshold (kg)"
                    type="number"
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={onCreateFeedType}
                  disabled={actions.createFeedType.isPending}
                >
                  {actions.createFeedType.isPending ? "Saving..." : "Save Feed Type"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-5">
        <StatCard
          title="Total Feed Types"
          value={String(inventory?.summary.totalFeedTypes ?? 0)}
          icon={<Wheat className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Total Stock on Hand"
          value={formatKg(inventory?.summary.totalStockOnHandKg ?? 0)}
          icon={<Scale className="h-4 w-4" />}
          density="compact"
        />
        <StatCard
          title="Low Stock Items"
          value={String(inventory?.summary.lowStockItems ?? 0)}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={(inventory?.summary.lowStockItems ?? 0) > 0 ? "warning" : "default"}
          density="compact"
        />
        <StatCard
          title="Expiring Soon"
          value={String(inventory?.summary.expiringSoonItems ?? 0)}
          icon={<CalendarDays className="h-4 w-4" />}
          variant={(inventory?.summary.expiringSoonItems ?? 0) > 0 ? "warning" : "default"}
          density="compact"
        />
        <StatCard
          title="Total Stock Value"
          value={formatMoney(inventory?.summary.totalStockValue ?? 0)}
          icon={<CircleDollarSign className="h-4 w-4" />}
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
        <div className="grid grid-cols-1 gap-3 rounded-2xl border bg-farm-800/80 p-4 md:grid-cols-5">
          <Input
            className="md:col-span-2"
            placeholder="Search feed name, category, species..."
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({ ...current, search: event.target.value }))
            }
          />
          <select
            className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                category: event.target.value as FeedTypeFilterState["category"],
              }))
            }
          >
            <option value="all" className="bg-farm-900 text-foreground">
              All categories
            </option>
            {feedCategories.map((category) => (
              <option key={category} value={category} className="bg-farm-900 text-foreground">
                {category.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filters.speciesId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, speciesId: event.target.value }))
            }
          >
            <option value="all" className="bg-farm-900 text-foreground">
              All species
            </option>
            <option value="unassigned" className="bg-farm-900 text-foreground">
              General feeds
            </option>
            {(speciesQuery.data ?? []).map((species) => (
              <option key={species.id} value={species.id} className="bg-farm-900 text-foreground">
                {species.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filters.stockStatus}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  stockStatus: event.target.value as FeedTypeFilterState["stockStatus"],
                }))
              }
            >
              <option value="all" className="bg-farm-900 text-foreground">
                All stock
              </option>
              <option value="in_stock" className="bg-farm-900 text-foreground">
                In stock
              </option>
              <option value="low_stock" className="bg-farm-900 text-foreground">
                Low stock
              </option>
              <option value="out_of_stock" className="bg-farm-900 text-foreground">
                Out of stock
              </option>
              <option value="expiring_soon" className="bg-farm-900 text-foreground">
                Expiring soon
              </option>
            </select>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setFilters(emptyFilters)}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground sm:text-base">Feed Type List</h2>
        <span className="text-xs text-farm-muted">{filteredRows.length} items</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredRows.map((row) => (
          <div
            key={row.feedType.id}
            className="rounded-2xl border bg-farm-800/80 p-4 text-left transition hover:bg-farm-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-lime/70"
            role="link"
            tabIndex={0}
            onClick={() =>
              navigate({
                to: "/feed/types/$id",
                params: { id: row.feedType.id },
              })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate({
                  to: "/feed/types/$id",
                  params: { id: row.feedType.id },
                });
              }
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{row.feedType.name}</div>
                <div className="mt-1 text-xs capitalize text-farm-muted">
                  {row.feedType.category.replaceAll("_", " ")} ·{" "}
                  {row.feedType.species_id
                    ? (speciesLabelById.get(row.feedType.species_id) ?? "-")
                    : "All species"}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  row.stockOnHandKg > 0
                    ? row.lowStock
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-emerald-500/20 text-emerald-200"
                    : "bg-farm-danger/20 text-farm-danger"
                }`}
              >
                {row.stockOnHandKg > 0 ? (row.lowStock ? "Low" : "In Stock") : "Out"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-farm-muted">Stock</div>
                <div className="mt-1 font-medium">{formatKg(row.stockOnHandKg)}</div>
              </div>
              <div>
                <div className="text-xs text-farm-muted">Avg Cost / Kg</div>
                <div className="mt-1 font-medium">{formatMoney(row.averageCostPerKg)}</div>
              </div>
              <div>
                <div className="text-xs text-farm-muted">Protein</div>
                <div className="mt-1 font-medium">
                  {row.feedType.protein_percentage === null
                    ? "-"
                    : `${Number(row.feedType.protein_percentage).toFixed(2)}%`}
                </div>
              </div>
              <div>
                <div className="text-xs text-farm-muted">Dry Matter</div>
                <div className="mt-1 font-medium">
                  {row.feedType.dry_matter_percentage === null
                    ? "-"
                    : `${Number(row.feedType.dry_matter_percentage).toFixed(2)}%`}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              className="mt-4 w-full"
              onClick={(event) => {
                event.stopPropagation();
                openBatchDialog(row.feedType.id);
              }}
            >
              Add Batch
            </Button>
          </div>
        ))}
      </div>

      {!inventoryQuery.isLoading && filteredRows.length === 0 && (
        <div className="rounded-2xl border bg-farm-800/80 p-5 text-sm text-farm-muted md:hidden">
          {rows.length === 0
            ? "No feed types found for this farm."
            : "No feed types match the selected filters."}
        </div>
      )}

      <div className="hidden overflow-x-auto rounded-xl border bg-farm-800/80 md:block">
        <table className="w-full min-w-245 text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Feed Name</th>
              <th className="px-5 py-3 text-left font-medium">Category</th>
              <th className="px-5 py-3 text-left font-medium">Species</th>
              <th className="px-5 py-3 text-left font-medium">Stock On Hand</th>
              <th className="px-5 py-3 text-left font-medium">Avg Cost / Kg</th>
              <th className="px-5 py-3 text-left font-medium">Protein %</th>
              <th className="px-5 py-3 text-left font-medium">Dry Matter %</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={row.feedType.id}
                className="cursor-pointer border-t border-farm-600/30 hover:bg-farm-700/30"
                role="link"
                tabIndex={0}
                onClick={() =>
                  navigate({
                    to: "/feed/types/$id",
                    params: { id: row.feedType.id },
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate({
                      to: "/feed/types/$id",
                      params: { id: row.feedType.id },
                    });
                  }
                }}
              >
                <td className="px-5 py-3">
                  <div className="font-medium">{row.feedType.name}</div>
                  <div className="text-xs text-farm-muted">{row.feedType.description ?? "-"}</div>
                </td>
                <td className="px-5 py-3 capitalize">
                  {row.feedType.category.replaceAll("_", " ")}
                </td>
                <td className="px-5 py-3 text-farm-muted">
                  {row.feedType.species_id
                    ? (speciesLabelById.get(row.feedType.species_id) ?? "-")
                    : "All"}
                </td>
                <td className="px-5 py-3">{formatKg(row.stockOnHandKg)}</td>
                <td className="px-5 py-3">{formatMoney(row.averageCostPerKg)}</td>
                <td className="px-5 py-3 text-farm-muted">
                  {row.feedType.protein_percentage === null
                    ? "-"
                    : `${Number(row.feedType.protein_percentage).toFixed(2)}%`}
                </td>
                <td className="px-5 py-3 text-farm-muted">
                  {row.feedType.dry_matter_percentage === null
                    ? "-"
                    : `${Number(row.feedType.dry_matter_percentage).toFixed(2)}%`}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      row.stockOnHandKg > 0
                        ? row.lowStock
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-emerald-500/20 text-emerald-200"
                        : "bg-farm-danger/20 text-farm-danger"
                    }`}
                  >
                    {row.stockOnHandKg > 0 ? (row.lowStock ? "Low" : "In Stock") : "Out"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openBatchDialog(row.feedType.id);
                      }}
                    >
                      Add Batch
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {inventoryQuery.isLoading && (
          <div className="p-5 text-sm text-farm-muted">Loading feeds...</div>
        )}
        {!inventoryQuery.isLoading && filteredRows.length === 0 && (
          <div className="p-5 text-sm text-farm-muted">
            {rows.length === 0
              ? "No feed types found for this farm."
              : "No feed types match the selected filters."}
          </div>
        )}
      </div>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feed Batch</DialogTitle>
            <DialogDescription>
              Register a feed stock lot and create an initial purchase movement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <select
              className="h-9 w-full rounded-md border border-input bg-farm-900 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={batchForm.feedTypeId}
              onChange={(event) =>
                setBatchForm((current) => ({ ...current, feedTypeId: event.target.value }))
              }
            >
              <option value="" className="bg-farm-900 text-foreground">
                Select feed type
              </option>
              {rows.map((row) => (
                <option
                  key={row.feedType.id}
                  value={row.feedType.id}
                  className="bg-farm-900 text-foreground"
                >
                  {row.feedType.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={batchForm.batchNumber}
                onChange={(event) =>
                  setBatchForm((current) => ({ ...current, batchNumber: event.target.value }))
                }
                placeholder="Batch number"
              />
              <Input
                value={batchForm.supplierName}
                onChange={(event) =>
                  setBatchForm((current) => ({ ...current, supplierName: event.target.value }))
                }
                placeholder="Supplier"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={batchForm.purchaseDate}
                onChange={(event) =>
                  setBatchForm((current) => ({ ...current, purchaseDate: event.target.value }))
                }
                type="date"
              />
              <Input
                value={batchForm.expiryDate}
                onChange={(event) =>
                  setBatchForm((current) => ({ ...current, expiryDate: event.target.value }))
                }
                type="date"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={batchForm.initialQuantityKg}
                onChange={(event) =>
                  setBatchForm((current) => ({
                    ...current,
                    initialQuantityKg: event.target.value,
                  }))
                }
                type="number"
                min={0}
                step="0.01"
                placeholder="Initial quantity (kg)"
              />
              <Input
                value={batchForm.unitCost}
                onChange={(event) =>
                  setBatchForm((current) => ({ ...current, unitCost: event.target.value }))
                }
                type="number"
                min={0}
                step="0.01"
                placeholder="Unit cost"
              />
            </div>

            <Input
              value={batchForm.storageLocation}
              onChange={(event) =>
                setBatchForm((current) => ({ ...current, storageLocation: event.target.value }))
              }
              placeholder="Storage location"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={onCreateBatch}
              disabled={actions.createFeedBatch.isPending}
            >
              {actions.createFeedBatch.isPending ? "Saving..." : "Save Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
