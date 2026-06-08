import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, error } = useOnboardingGuard();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 text-sm text-farm-muted">
        Checking your access…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 p-6 text-sm text-farm-muted">
        <div className="max-w-md space-y-3 rounded-2xl border border-border bg-farm-900/80 p-6 text-center shadow-lg">
          <p className="text-foreground">Unable to verify onboarding status.</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
