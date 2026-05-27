import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import { weightService } from "../services/weightService";

export function WeightRecordsPage() {
  const { currentFarm } = useCurrentFarm();
  const query = useQuery({
    queryKey: ["weight-records", currentFarm.id],
    queryFn: () => weightService.getWeightRecords(currentFarm.id),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Weight Records"
        description="Log and review weight measurements per animal."
      />
      <div className="overflow-x-auto rounded-2xl border bg-farm-800/80">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-farm-900/60 text-xs uppercase tracking-wider text-farm-muted">
            <tr>
              {["Animal", "Weight", "Recorded At", "Notes"].map((heading) => (
                <th key={heading} className="px-5 py-3 text-left font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(query.data ?? []).map((record) => (
              <tr key={record.id} className="border-t border-farm-600/30">
                <td className="px-5 py-3 font-mono text-farm-lime">
                  {record.animal_id.slice(0, 8)}
                </td>
                <td className="px-5 py-3">{Number(record.weight_kg).toFixed(2)} kg</td>
                <td className="px-5 py-3 text-farm-muted">{record.recorded_at}</td>
                <td className="px-5 py-3 text-farm-muted">{record.notes ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {query.isLoading && (
          <div className="p-5 text-sm text-farm-muted">Loading weight records...</div>
        )}
        {!query.isLoading && (query.data ?? []).length === 0 && (
          <div className="p-5 text-sm text-farm-muted">No weight records found.</div>
        )}
      </div>
    </div>
  );
}
