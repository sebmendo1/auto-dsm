import type { LucideIcon } from "lucide-react";

type MetricTileProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

/** Dashboard metric tile (design tokens). */
export function MetricTile({ label, value, icon: Icon }: MetricTileProps) {
  return (
    <div className="rounded-delicate border border-border bg-background-elevated px-4 py-4 shadow-sm transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-md dark:shadow-none">
      <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-content-faint">
        {label}
      </p>
      <div className="mt-3 flex w-fit items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={2} aria-hidden />
        <p className="m-0 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
