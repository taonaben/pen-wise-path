import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";

export const Route = createFileRoute("/_app/farm/profile")({
  component: FarmProfilePage,
});

function FarmProfilePage() {
  const { currentFarm } = useCurrentFarm();

  return (
    <div>
      <PageHeader
        title="Farm Profile"
        description="Manage your farm's identity and core configuration."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-farm-800/80 p-6">
          <h3 className="font-semibold mb-4">Farm Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-farm-muted">Name</dt>
              <dd>{currentFarm.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-farm-muted">Location</dt>
              <dd>{currentFarm.location ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-farm-muted">Created</dt>
              <dd>{new Date(currentFarm.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-farm-muted">Farm ID</dt>
              <dd className="font-mono text-xs">{currentFarm.id.slice(0, 8)}</dd>
            </div>
          </dl>
        </div>
        <ComingSoon
          title="Edit farm profile"
          description="Wire up Supabase updates for farm metadata, units, and currency preferences."
        />
      </div>
    </div>
  );
}
