import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ReportDataTable({ title, description, children }: Props) {
  return (
    <section className="rounded-2xl border bg-farm-800/70 p-5">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="text-sm text-farm-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
