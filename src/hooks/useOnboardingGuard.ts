import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/shared/lib/supabase";
import { onboardingService } from "@/services/onboardingService";
import type { OnboardingStatus } from "@/types/auth";

interface UseOnboardingGuardResult {
  loading: boolean;
  status: OnboardingStatus | null;
  error: Error | null;
}

export function useOnboardingGuard(): UseOnboardingGuardResult {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<OnboardingStatus | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      try {
        setLoading(true);

        const { data, error: authError } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!data.user) {
          if (!cancelled) {
            setStatus(null);
            await navigate({ to: "/login", replace: true });
          }
          return;
        }

        const onboardingStatus = await onboardingService.getOnboardingStatus(data.user.id);

        if (cancelled) {
          return;
        }

        setStatus(onboardingStatus);

        if (!onboardingStatus.isComplete) {
          await navigate({ to: onboardingStatus.nextRoute, replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unable to check onboarding status"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return { loading, status, error };
}
