import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "@/features/auth/services/authService";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.getSession().then((session) => {
      if (!mounted) return;
      if (!session) navigate({ to: "/login" });
      else setChecked(true);
    });
    const { data } = authService.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-farm-950 text-farm-muted text-sm">
        Loading…
      </div>
    );
  }
  return <>{children}</>;
}
