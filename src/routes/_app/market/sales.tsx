import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ComingSoon } from "@/shared/components/ui/ComingSoon";

export const Route = createFileRoute("/_app/market/sales")({
  component: () => (
    <div>
      <PageHeader title="Sales Records" description="History of animal sales, prices, and buyers." />
      <ComingSoon title="Sales log table" description="Will list sales_records with totals and profit margins." />
    </div>
  ),
});
