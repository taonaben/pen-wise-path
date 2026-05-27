import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "default";

type Props = {
  status: string;
  variant?: Variant;
};

const styles: Record<Variant, string> = {
  default: "bg-farm-700/60 text-farm-muted border-farm-600/60",
  success: "bg-farm-success/15 text-farm-success border-farm-success/30",
  warning: "bg-farm-warning/15 text-farm-warning border-farm-warning/30",
  danger: "bg-farm-danger/15 text-farm-danger border-farm-danger/30",
};

export function StatusBadge({ status, variant = "default" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
      )}
    >
      {status}
    </span>
  );
}
