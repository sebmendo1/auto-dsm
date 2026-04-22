"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  brandDashboardCardRadius,
  brandTokenSurface,
  defaultPaletteSurface,
} from "@/components/ui/brand-card-tokens";
import {
  shadeScaleFrom600,
  shadeSwatchesFromHexes,
  type ShadeSwatch,
} from "@/lib/color/shade-scale-from-600";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_STOPS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9] as const;

export interface ColorPaletteCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Main label (e.g. “Primary”). */
  title: React.ReactNode;
  /** Optional top-right label (e.g. base hex). */
  trailing?: React.ReactNode;
  /**
   * Base color at weight **600**. When set (or implied via `swatchColors[0]`),
   * builds a 10-step OKLch scale (900 → 50, dark → light, left → right).
   */
  baseColor?: string;
  /**
   * Exactly **10** hex colors in order **900 → 50** (left → right). When provided,
   * overrides generated scale from `baseColor`.
   */
  swatchColors?: readonly string[];
  /** Dark inner card background (opacity-ramp mode only). */
  surfaceClassName?: string;
  shadowClassName?: string;
  /**
   * Opacity multipliers 0–1 for white over `surface` (9 columns).
   * Used only when no tint scale is resolved (no `baseColor` / `swatchColors`).
   */
  stops?: readonly number[];
  stripClassName?: string;
}

function resolveTintSwatches(
  baseColor: string | undefined,
  swatchColors: readonly string[] | undefined,
): ShadeSwatch[] | null {
  if (swatchColors?.length === 10) {
    return shadeSwatchesFromHexes(swatchColors);
  }
  const raw = baseColor?.trim() || swatchColors?.[0]?.trim() || "";
  if (!raw) return null;
  return shadeScaleFrom600(raw);
}

function hexLabel(hex: string) {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return `#${h.toUpperCase()}`;
}

/**
 * **Tint scale:** light shell card (no border/shadow) + title + pill bar of 10 shades (900→50); hover shows HEX + weight.
 * **Ramp mode:** dark card + white opacity columns (when no base / swatches).
 */
export const ColorPaletteCard = React.forwardRef<HTMLDivElement, ColorPaletteCardProps>(
  (
    {
      className,
      title,
      trailing,
      surfaceClassName,
      shadowClassName,
      stops = DEFAULT_STOPS,
      swatchColors,
      baseColor,
      stripClassName,
      ...props
    },
    ref,
  ) => {
    const tint = React.useMemo(
      () => resolveTintSwatches(baseColor, swatchColors),
      [baseColor, swatchColors],
    );

    if (tint) {
      return (
        <div
          ref={ref}
          {...props}
          className={cn("w-full min-w-0 p-6", brandTokenSurface, className)}
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0 text-[15px] font-medium leading-snug tracking-tight text-[var(--text-primary)]">
              {title}
            </div>
            {trailing != null ? (
              <div className="shrink-0 text-[12px] font-medium text-[var(--text-tertiary)]">
                {trailing}
              </div>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-12 w-full min-w-0 overflow-hidden rounded-full",
              stripClassName,
            )}
          >
            {tint.map(({ weight, hex }) => (
              <Tooltip key={weight}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="relative min-h-0 min-w-0 flex-1 cursor-default border-0 p-0 transition-[filter] duration-150 hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
                    style={{ backgroundColor: hex }}
                    aria-label={`Shade ${weight} ${hexLabel(hex)}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono text-[11px] uppercase tracking-wide">
                  {weight} · {hexLabel(hex)}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      );
    }

    const list = (stops.length > 0 ? stops : DEFAULT_STOPS) as readonly number[];

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          "w-full min-w-0 overflow-hidden text-white",
          brandDashboardCardRadius,
          defaultPaletteSurface,
          surfaceClassName,
          shadowClassName,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-0 pt-3">
          <div className="min-w-0 text-[12px] font-medium leading-tight sm:text-sm">
            {title}
          </div>
          {trailing != null ? (
            <div className="shrink-0 text-[12px] font-medium text-white/90 opacity-80">
              {trailing}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-1 flex h-[50px] w-full min-w-0 gap-0 px-0 pb-3 pt-2",
            stripClassName,
          )}
        >
          {list.map((alpha, i) => (
            <div
              key={i}
              className="min-h-0 min-w-0 flex-1 bg-white"
              style={{ opacity: alpha }}
            />
          ))}
        </div>
      </div>
    );
  },
);
ColorPaletteCard.displayName = "ColorPaletteCard";
