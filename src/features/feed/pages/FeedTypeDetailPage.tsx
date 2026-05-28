import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { useAnimalSpecies } from "@/features/animals/hooks/useAnimalSpecies";
import { useFeedTypeDetail } from "../hooks/useFeedTypeDetail";

type Props = {
  feedTypeId: string;
};

function formatKg(value: number) {
  return `${value.toFixed(2)} kg`;
}

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function FeedTypeDetailPage({ feedTypeId }: Props) {
  const { currentFarm } = useCurrentFarm();
  const speciesQuery = useAnimalSpecies();
  const detailQuery = useFeedTypeDetail(currentFarm.id, feedTypeId);

  const detail = detailQuery.data;
  const feedType = detail?.feedType;

  const speciesLabelById = new Map(
    (speciesQuery.data ?? []).map((species) => [species.id, species.name]),
  );

  return (
    <div className="space-y-5">
      <Link to="/feed/types" className="inline-flex text-sm text-farm-muted hover:text-farm-lime">
        Back to feed types
      </Link>

      {detailQuery.isLoading && (
        <div className="rounded-xl border bg-farm-800/80 p-6 text-sm text-farm-muted">
          Loading feed type detail...
        </div>
      )}

      {detailQuery.isError && (
        <div className="rounded-xl border border-farm-danger/30 bg-farm-danger/10 p-6 text-sm text-farm-danger">
          Feed type detail could not be loaded.
        </div>
      )}

      {feedType && (
        <>
          <PageHeader
            title={feedType.name}
            description="Nutritional profile, movement history, and stock batches for this feed type."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-farm-800/80 p-4">
              <div className="text-xs text-farm-muted">Stock On Hand</div>
              <div className="mt-2 text-xl font-semibold">
                {formatKg(detail?.summary?.stockOnHandKg ?? 0)}
              </div>
            </div>
            <div className="rounded-xl border bg-farm-800/80 p-4">
              <div className="text-xs text-farm-muted">Stock Value</div>
              <div className="mt-2 text-xl font-semibold">
                {formatMoney(detail?.summary?.stockValue ?? 0)}
              </div>
            </div>
            <div className="rounded-xl border bg-farm-800/80 p-4">
              <div className="text-xs text-farm-muted">Average Cost / Kg</div>
              <div className="mt-2 text-xl font-semibold">
                {formatMoney(detail?.summary?.averageCostPerKg ?? 0)}
              </div>
            </div>
            <div className="rounded-xl border bg-farm-800/80 p-4">
              <div className="text-xs text-farm-muted">Batches</div>
              <div className="mt-2 text-xl font-semibold">{detail?.batches.length ?? 0}</div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-5">
            <div className="overflow-x-auto">
              <TabsList className="h-auto min-w-max justify-start bg-farm-900/70 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
                <TabsTrigger value="batches">Batches</TabsTrigger>
                <TabsTrigger value="movements">Movements</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-farm-800/80 p-5">
                  <h3 className="text-sm font-semibold">Feed Profile</h3>
                  <div className="mt-3 space-y-2 text-sm text-farm-muted">
                    <p>
                      Category:{" "}
                      <span className="text-foreground capitalize">
                        {feedType.category.replaceAll("_", " ")}
                      </span>
                    </p>
                    <p>
                      Species:{" "}
                      <span className="text-foreground">
                        {feedType.species_id
                          ? (speciesLabelById.get(feedType.species_id) ?? "-")
                          : "All"}
                      </span>
                    </p>
                    <p>
                      Low stock threshold:{" "}
                      <span className="text-foreground">
                        {formatKg(Number(feedType.low_stock_threshold_kg ?? 0))}
                      </span>
                    </p>
                    <p>
                      Status:{" "}
                      <span className="text-foreground">
                        {feedType.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border bg-farm-800/80 p-5">
                  <h3 className="text-sm font-semibold">Notes</h3>
                  <p className="mt-3 text-sm text-farm-muted">
                    {feedType.description || feedType.notes || "No notes recorded."}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutrition">
              <div className="rounded-xl border bg-farm-800/80 p-5">
                <h3 className="text-sm font-semibold">Nutritional Data</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Crude Protein</div>
                    <div className="mt-1 font-medium">
                      {formatPercent(feedType.protein_percentage)}
                    </div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Dry Matter</div>
                    <div className="mt-1 font-medium">
                      {formatPercent(feedType.dry_matter_percentage)}
                    </div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Crude Fiber</div>
                    <div className="mt-1 font-medium">
                      {formatPercent(feedType.crude_fiber_percentage)}
                    </div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Fat</div>
                    <div className="mt-1 font-medium">{formatPercent(feedType.fat_percentage)}</div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Calcium</div>
                    <div className="mt-1 font-medium">
                      {formatPercent(feedType.calcium_percentage)}
                    </div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3">
                    <div className="text-xs text-farm-muted">Phosphorus</div>
                    <div className="mt-1 font-medium">
                      {formatPercent(feedType.phosphorus_percentage)}
                    </div>
                  </div>
                  <div className="rounded-md border border-farm-600/30 p-3 sm:col-span-2">
                    <div className="text-xs text-farm-muted">Energy (ME MJ/kg)</div>
                    <div className="mt-1 font-medium">
                      {feedType.energy_me_mj_per_kg === null
                        ? "-"
                        : Number(feedType.energy_me_mj_per_kg).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="batches">
              <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
                <table className="w-full min-w-200 text-sm">
                  <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Batch</th>
                      <th className="px-5 py-3 text-left font-medium">Supplier</th>
                      <th className="px-5 py-3 text-left font-medium">Purchased</th>
                      <th className="px-5 py-3 text-left font-medium">Initial Qty</th>
                      <th className="px-5 py-3 text-left font-medium">Unit Cost</th>
                      <th className="px-5 py-3 text-left font-medium">Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail?.batches.map((batch) => (
                      <tr key={batch.id} className="border-t border-farm-600/30">
                        <td className="px-5 py-3">{batch.batch_number ?? batch.id.slice(0, 8)}</td>
                        <td className="px-5 py-3 text-farm-muted">{batch.supplier_name ?? "-"}</td>
                        <td className="px-5 py-3">{formatDate(batch.purchase_date)}</td>
                        <td className="px-5 py-3">{formatKg(Number(batch.initial_quantity_kg))}</td>
                        <td className="px-5 py-3">{formatMoney(Number(batch.unit_cost))}</td>
                        <td className="px-5 py-3 text-farm-muted">
                          {formatDate(batch.expiry_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detail && detail.batches.length === 0 && (
                  <div className="p-5 text-sm text-farm-muted">
                    No batches found for this feed type.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="movements">
              <div className="overflow-x-auto rounded-xl border bg-farm-800/80">
                <table className="w-full min-w-200 text-sm">
                  <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-left font-medium">Type</th>
                      <th className="px-5 py-3 text-left font-medium">Quantity</th>
                      <th className="px-5 py-3 text-left font-medium">Unit Cost</th>
                      <th className="px-5 py-3 text-left font-medium">Total Cost</th>
                      <th className="px-5 py-3 text-left font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail?.movements.map((movement) => (
                      <tr key={movement.id} className="border-t border-farm-600/30">
                        <td className="px-5 py-3">{formatDate(movement.movement_date)}</td>
                        <td className="px-5 py-3 capitalize">
                          {movement.movement_type.replaceAll("_", " ")}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={
                              Number(movement.quantity_kg) < 0
                                ? "text-farm-danger"
                                : "text-emerald-300"
                            }
                          >
                            {formatKg(Number(movement.quantity_kg))}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-farm-muted">
                          {movement.unit_cost === null
                            ? "-"
                            : formatMoney(Number(movement.unit_cost))}
                        </td>
                        <td className="px-5 py-3 text-farm-muted">
                          {movement.total_cost === null
                            ? "-"
                            : formatMoney(Number(movement.total_cost))}
                        </td>
                        <td className="px-5 py-3 text-farm-muted">
                          {movement.reference_type ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detail && detail.movements.length === 0 && (
                  <div className="p-5 text-sm text-farm-muted">
                    No movement history found for this feed type.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
