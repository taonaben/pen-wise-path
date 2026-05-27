import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/settings")({
  component: () => (
    <div>
      <PageHeader title="Settings" description="App preferences, units, currency, and notifications." />
      <ComingSoon title="Account & farm settings" description="Will allow toggling units (kg/lb), currency, and notification channels." />
    </div>
  ),
});
