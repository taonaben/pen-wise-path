import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/animals/weights")({
  component: () => (
    <div>
      <PageHeader title="Weight Records" description="Log and review weight measurements per animal." />
      <ComingSoon title="Weight log table" description="Will list weight_records joined with animals, filterable by date and tag." />
    </div>
  ),
});
