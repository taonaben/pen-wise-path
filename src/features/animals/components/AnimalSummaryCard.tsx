import type { ReactNode } from "react";
import { StatCard } from "@/shared/components/ui/StatCard";

type Props = {
  title: string;
  value: number | string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  icon?: ReactNode;
};

export function AnimalSummaryCard({ title, value, description, variant = "default", icon }: Props) {
  return (
    <StatCard
      title={title}
      value={String(value)}
      description={description}
      variant={variant}
      density="compact"
      icon={icon}
    />
  );
}
