import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type { AnimalPerformance } from "../types/animal.types";

const performanceVariant: Record<AnimalPerformance, "success" | "warning" | "danger" | "default"> =
  {
    Critical: "danger",
    Underperforming: "warning",
    Normal: "default",
    Excellent: "success",
    Unknown: "default",
  };

export function GrowthStatusBadge({ performance }: { performance: AnimalPerformance }) {
  return <StatusBadge status={performance} variant={performanceVariant[performance]} />;
}
