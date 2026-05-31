import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { useCurrentFarm } from "@/features/farm/hooks/useCurrentFarm";
import type { Profile } from "@/features/farm/types/farm.types";
import { supabase } from "@/shared/lib/supabase";

export const Route = createFileRoute("/_app/settings")({
  component: MePage,
});

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString();
}

function MePage() {
  const { currentUser, currentRole, currentFarm } = useCurrentFarm();

  const profileQuery = useQuery({
    queryKey: ["me-profile", currentUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, last_active_at, created_at, updated_at")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  const profile = profileQuery.data;
  const displayName =
    profile?.full_name ||
    currentUser.user_metadata?.full_name ||
    currentUser.email ||
    "Farm member";
  const displayEmail = profile?.email || currentUser.email || "No email";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Me"
        description="Your account profile and membership details in the current farm."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-farm-800/80 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-full bg-farm-lime text-farm-950 text-sm font-bold flex items-center justify-center">
              {initials || "U"}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{displayName}</h3>
              <p className="text-sm text-farm-muted truncate">{displayEmail}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-farm-muted">Role in current farm</dt>
              <dd className="capitalize">{currentRole}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-farm-muted">Current farm</dt>
              <dd className="text-right">{currentFarm.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-farm-muted">Last active</dt>
              <dd className="text-right">{formatDate(profile?.last_active_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border bg-farm-800/80 p-6">
          <h3 className="font-semibold mb-4">Account Details</h3>

          {profileQuery.isLoading && (
            <div className="rounded-xl border border-farm-700/70 bg-farm-900/40 p-4 text-sm text-farm-muted">
              Loading your profile...
            </div>
          )}

          {profileQuery.isError && (
            <div className="rounded-xl border border-farm-danger/40 bg-farm-danger/10 p-4 text-sm text-farm-danger">
              Could not load your profile details right now.
            </div>
          )}

          {!profileQuery.isLoading && !profileQuery.isError && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-farm-muted">User ID</dt>
                <dd className="font-mono text-xs">{currentUser.id.slice(0, 8)}...</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-farm-muted">Profile email</dt>
                <dd className="text-right">{displayEmail}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-farm-muted">Profile updated</dt>
                <dd className="text-right">{formatDate(profile?.updated_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-farm-muted">Joined profile</dt>
                <dd className="text-right">{formatDate(profile?.created_at)}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
