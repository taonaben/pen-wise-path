import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import type { AnimalStatus } from "../types/animal.types";

const statusVariant: Record<AnimalStatus, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  sold: "default",
  sick: "warning",
  removed: "default",
  dead: "danger",
};

export function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  return <StatusBadge status={status} variant={statusVariant[status]} />;
}
