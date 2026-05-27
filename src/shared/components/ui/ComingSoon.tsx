import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  description?: string;
};

export function ComingSoon({ title, description }: Props) {
  return (
    <div className="rounded-2xl border bg-farm-800/60 p-8">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-farm-lime/15 text-farm-lime flex items-center justify-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-1 text-sm text-farm-muted">{description}</p>}
        </div>
      </div>
    </div>
  );
}
