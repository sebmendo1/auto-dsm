import * as React from "react";
import { cn } from "@/lib/utils";
import { brandCardPaper } from "@/components/ui/brand-card-tokens";

export interface TypographyMetricTab {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value?: React.ReactNode;
}

export type TypographyMetricTabsTuple = [
  TypographyMetricTab,
  TypographyMetricTab,
  TypographyMetricTab,
];

export interface TypographyMetricPillsProps {
  tabs: TypographyMetricTabsTuple;
  /** Spacing above the row (e.g. when following preview vs body). */
  className?: string;
}

/**
 * Three spec chips (size / line height / letter spacing) shared by typography cards.
 */
export function TypographyMetricPills({ tabs, className }: TypographyMetricPillsProps) {
  return (
    <div
      className={cn(
        "grid min-h-[24px] grid-cols-3 gap-2 sm:gap-3",
        className,
      )}
    >
      {tabs.map((tab, i) => (
        <div
          key={i}
          className={cn(
            "flex h-6 min-w-0 items-center justify-center gap-1.5 rounded-full px-1.5 sm:h-6",
            "text-[10px] font-medium text-[var(--text-primary)] sm:text-[11px]",
            brandCardPaper,
          )}
        >
          {tab.icon != null ? (
            <span className="flex shrink-0 text-[var(--text-primary)] [&_svg]:size-3.5 sm:[&_svg]:size-4">
              {tab.icon}
            </span>
          ) : null}
          <span className="min-w-0 truncate">{tab.label}</span>
          {tab.value != null ? (
            <span className="shrink-0 text-[10px] opacity-80 sm:text-[11px]">
              {tab.value}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
