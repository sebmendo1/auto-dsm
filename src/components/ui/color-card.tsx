"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  brandCardPaper,
  brandDashboardCardRadius,
  brandTokenSurface,
} from "@/components/ui/brand-card-tokens";

export interface ColorCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Swatch / brand fill (e.g. `#9D11FF` from the design ref). Used when `swatchSlot` is omitted. */
  swatchColor: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  copyLabel?: string;
  onCopy?: () => void;
  /** Extra classes for the default swatch box (ignored when `swatchSlot` is set). */
  swatchClassName?: string;
  /** classes for the Copy pill. */
  copyButtonClassName?: string;
  /** Optional classes for the subtitle line. */
  subtitleClassName?: string;
  /** Replace the default swatch (e.g. HoverCard trigger, larger preview). */
  swatchSlot?: React.ReactNode;
  /** Extra block below the main row (specs, contrast, copy targets). */
  footer?: React.ReactNode;
}

/**
 * Single-color row: swatch + title stack + “Copy” pill.
 * Optional `footer` / `swatchSlot` support richer dashboards (e.g. `/dashboard/colors`).
 */
export const ColorCard = React.forwardRef<HTMLDivElement, ColorCardProps>(
  (
    {
      className,
      swatchColor,
      title,
      subtitle,
      copyLabel = "Copy",
      onCopy,
      swatchClassName,
      copyButtonClassName,
      subtitleClassName,
      swatchSlot,
      footer,
      ...props
    },
    ref,
  ) => {
    const rich = footer != null;

    const mainRow = (
      <>
        {swatchSlot ?? (
          <div
            className={cn("h-12 w-12 shrink-0", brandDashboardCardRadius, swatchClassName)}
            style={{ backgroundColor: swatchColor }}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-tight text-[var(--text-primary)]">
            {title}
          </p>
          <p
            className={cn(
              "mt-0.5 truncate text-[12px] leading-tight text-[var(--text-primary)]",
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!onCopy}
          className={cn(
            "h-6 shrink-0 rounded-full px-3",
            "text-center text-[12px] font-medium text-[var(--text-primary)]",
            brandCardPaper,
            "outline-none transition-opacity",
            onCopy
              ? "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
              : "cursor-not-allowed opacity-50",
            copyButtonClassName,
          )}
          aria-label={copyLabel}
        >
          {copyLabel}
        </button>
      </>
    );

    if (rich) {
      return (
        <div
          ref={ref}
          className={cn(
            "flex flex-col overflow-hidden",
            brandTokenSurface,
            className,
          )}
          {...props}
        >
          <div className="flex min-h-20 items-center gap-4 px-4 py-3">{mainRow}</div>
          <div className="border-t border-[var(--border-subtle)] px-4 pb-3 pt-3">
            {footer}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
            "flex h-20 items-center gap-4 px-4",
            brandTokenSurface,
            className,
        )}
        {...props}
      >
        {mainRow}
      </div>
    );
  },
);
ColorCard.displayName = "ColorCard";
