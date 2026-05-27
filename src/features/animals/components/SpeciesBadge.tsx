import { StatusBadge } from "@/shared/components/ui/StatusBadge";

export function SpeciesBadge({ label }: { label: string }) {
  return <StatusBadge status={label} variant="default" />;
}
