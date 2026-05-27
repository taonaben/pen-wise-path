import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/shared/components/layout/AppLayout";
import { ProtectedRoute } from "@/shared/components/layout/ProtectedRoute";

export const Route = createFileRoute("/_app")({
  component: () => (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  ),
});
