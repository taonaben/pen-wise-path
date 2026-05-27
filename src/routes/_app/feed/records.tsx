import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/feed/records")({
  component: () => (
    <div>
      <PageHeader title="Feed Records" description="Daily feed events logged per animal." />
      <ComingSoon title="Feed log table" description="Will surface feed_records joined with feed_types and animals." />
    </div>
  ),
});
