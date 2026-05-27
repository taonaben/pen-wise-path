import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/farm/profile")({
  component: FarmProfilePage,
});

function FarmProfilePage() {
  return (
    <div>
      <PageHeader title="Farm Profile" description="Manage your farm’s identity and core configuration." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-farm-800/80 p-6">
          <h3 className="font-semibold mb-4">Farm Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-farm-muted">Name</dt><dd>Green Valley Farm</dd></div>
            <div className="flex justify-between"><dt className="text-farm-muted">Location</dt><dd>Mashonaland West</dd></div>
            <div className="flex justify-between"><dt className="text-farm-muted">Members</dt><dd>4</dd></div>
            <div className="flex justify-between"><dt className="text-farm-muted">Active animals</dt><dd>46</dd></div>
          </dl>
        </div>
        <ComingSoon title="Edit farm profile" description="Wire up Supabase updates for farm metadata, units, and currency preferences." />
      </div>
    </div>
  );
}
