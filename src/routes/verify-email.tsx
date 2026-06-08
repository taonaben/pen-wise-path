import * as React from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { onboardingService } from "@/services/onboardingService";
import { supabase } from "@/shared/lib/supabase";

type VerifyEmailSearch = {
  email?: string;
};

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): VerifyEmailSearch => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [status, setStatus] = React.useState<"awaiting" | "error">("awaiting");
  const [isChecking, setIsChecking] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const isMissingSessionError = (authError: unknown) => {
    const message = authError instanceof Error ? authError.message : String(authError);
    return message.toLowerCase().includes("auth session missing");
  };

  const resolveOnboardingJump = React.useCallback(async () => {
    try {
      setIsChecking(true);
      setError(null);

      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) {
        if (isMissingSessionError(userError)) {
          setStatus("awaiting");
          return;
        }

        throw userError;
      }

      if (!data.user) {
        setStatus("awaiting");
        return;
      }

      if (!data.user.email_confirmed_at) {
        setStatus("awaiting");
        return;
      }

      const onboardingStatus = await onboardingService.getOnboardingStatus(data.user.id);

      toast.success("Email verified");
      await navigate({ to: onboardingStatus.nextRoute, replace: true });
    } catch (jumpError) {
      setStatus("error");
      setError(jumpError instanceof Error ? jumpError.message : "Unable to continue onboarding.");
    } finally {
      setIsChecking(false);
    }
  }, [navigate]);

  React.useEffect(() => {
    let active = true;

    const safeResolve = async () => {
      if (!active) {
        return;
      }

      await resolveOnboardingJump();
    };

    const { data: authSubscription } = supabase.auth.onAuthStateChange(() => {
      void safeResolve();
    });

    void safeResolve();

    const pollingTimer = window.setInterval(() => {
      void safeResolve();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(pollingTimer);
      authSubscription.subscription.unsubscribe();
    };
  }, [resolveOnboardingJump]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 px-6 text-foreground">
        <Card className="w-full max-w-lg border-farm-800/80 bg-farm-900/80 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle>Verification could not be completed</CardTitle>
            <CardDescription className="text-destructive">
              {error ?? "Unable to continue onboarding."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-full">
              <Link to="/login">Go to login</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/register">Create account again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-farm-950 px-6 text-foreground">
      <Card className="w-full max-w-lg border-farm-800/80 bg-farm-900/80 shadow-2xl backdrop-blur">
        <CardHeader>
          <CardTitle>{isChecking ? "Checking verification" : "Waiting for verification"}</CardTitle>
          <CardDescription>
            {search.email
              ? `Open the verification email sent to ${search.email} and click the confirmation link.`
              : "Open your verification email and click the confirmation link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-farm-muted">
          <p>
            {isChecking
              ? "Checking your verification status now..."
              : "If you verify on another device, come back here and we will send you to the next onboarding step automatically."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="rounded-full"
              onClick={() => void resolveOnboardingJump()}
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : "Check status"}
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/login">Sign in on this device</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/register">Use a different email</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
