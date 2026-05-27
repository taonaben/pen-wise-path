import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger";

type Props = {
  title: string;
  value: string;
  description?: string;
  trend?: string;
  icon?: ReactNode;
  variant?: Variant;
};

const accent: Record<Variant, string> = {
  default: "text-farm-lime",
  success: "text-farm-success",
  warning: "text-farm-warning",
  danger: "text-farm-danger",
};

export function StatCard({ title, value, description, trend, icon, variant = "default" }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/80 p-5 backdrop-blur-sm transition hover:bg-farm-800">
      <div className="flex items-start justify-between">
        <div className="text-sm text-farm-muted">{title}</div>
        {icon && <div className={cn("h-9 w-9 rounded-xl bg-farm-700/60 flex items-center justify-center", accent[variant])}>{icon}</div>}
      </div>
      <div className="mt-3 text-3xl font-semibold text-foreground tracking-tight">{value}</div>
      {(description || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && <span className={cn("font-medium", accent[variant])}>{trend}</span>}
          {description && <span className="text-farm-muted">{description}</span>}
        </div>
      )}
    </div>
  );
}
