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
  density?: "default" | "compact";
  onClick?: () => void;
};

const accent: Record<Variant, string> = {
  default: "text-farm-lime",
  success: "text-farm-success",
  warning: "text-farm-warning",
  danger: "text-farm-danger",
};

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = "default",
  density = "default",
  onClick,
}: Props) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border bg-farm-800/80 text-left backdrop-blur-sm transition hover:bg-farm-800",
        onClick &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-lime/70 focus-visible:ring-offset-2 focus-visible:ring-offset-farm-950",
        density === "compact" ? "p-3.5 sm:p-4" : "p-5",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "text-farm-muted",
            density === "compact" ? "text-xs sm:text-sm" : "text-sm",
          )}
        >
          {title}
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center bg-farm-700/60",
              density === "compact" ? "h-8 w-8 rounded-lg" : "h-9 w-9 rounded-xl",
              accent[variant],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div
        className={cn(
          "font-semibold tracking-tight text-foreground",
          density === "compact" ? "mt-2 text-2xl sm:text-[1.75rem]" : "mt-3 text-3xl",
        )}
      >
        {value}
      </div>
      {(description || trend) && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            density === "compact" ? "mt-1.5" : "mt-2",
          )}
        >
          {trend && <span className={cn("font-medium", accent[variant])}>{trend}</span>}
          {description && <span className="text-farm-muted">{description}</span>}
        </div>
      )}
    </Component>
  );
}
