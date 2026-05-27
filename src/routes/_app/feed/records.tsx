import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/feed/records")({
  component: () => (
    <div>
      <PageHeader title="Feed Records" description="Daily feeding events and animal allocations." />
      <ComingSoon
        title="Feeding event table"
        description="Will surface feeding_events joined with feed types, pens, and per-animal allocations."
      />
    </div>
  ),
});
