import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { ProtectedRoute } from "@/shared/components/layout/ProtectedRoute";
import { CurrentFarmProvider } from "@/features/farm/components/CurrentFarmProvider";

export const Route = createFileRoute("/_app")({
  component: () => (
    <ProtectedRoute>
      <CurrentFarmProvider>
        <AppLayout />
      </CurrentFarmProvider>
    </ProtectedRoute>
  ),
});
