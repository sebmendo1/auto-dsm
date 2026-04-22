import * as React from "react";
import { cn } from "@/lib/utils";
import { brandTokenSurface } from "@/components/ui/brand-card-tokens";
import {
  TypographyMetricPills,
  type TypographyMetricTabsTuple,
} from "@/components/ui/typography-metric-pills";

export interface TypographyBodyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small upper-left label. */
  eyebrow?: React.ReactNode;
  /** Upper-right, muted (ref: opacity 0.5 in SVG group). */
  sampleLabel?: React.ReactNode;
  /** Main paragraph(s). */
  body: React.ReactNode;
  /** Main text color; default `var(--text-primary)`. */
  bodyClassName?: string;
  /** Token-accurate typography on the body block. */
  bodyStyle?: React.CSSProperties;
  /** Optional three spec pills (size / line height / letter spacing). */
  tabs?: TypographyMetricTabsTuple;
}

/**
 * Lorem / body sample block: optional header row + body text, optional metric pills.
 * Matches the Body.svg top section: muted meta row, primary paragraph.
 */
export const TypographyBodyCard = React.forwardRef<
  HTMLDivElement,
  TypographyBodyCardProps
>(
  (
    {
      className,
      eyebrow,
      sampleLabel,
      body,
      bodyClassName,
      bodyStyle,
      tabs,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(brandTokenSurface, "p-4", className)}
        {...props}
      >
        {(eyebrow != null || sampleLabel != null) && (
          <div className="mb-2 flex items-start justify-between gap-3">
            {eyebrow != null ? (
              <p className="min-w-0 text-[10px] font-medium uppercase tracking-wide text-[var(--text-primary)] sm:text-[11px]">
                {eyebrow}
              </p>
            ) : (
              <span />
            )}
            {sampleLabel != null ? (
              <p className="shrink-0 text-[10px] font-medium text-[var(--text-primary)] opacity-50 sm:text-[11px]">
                {sampleLabel}
              </p>
            ) : null}
          </div>
        )}
        <div
          className={cn(
            "text-[15px] leading-[1.45] text-[var(--text-primary)]",
            bodyClassName,
          )}
          style={bodyStyle}
        >
          {body}
        </div>
        {tabs != null ? (
          <TypographyMetricPills tabs={tabs} className="mt-4 sm:mt-5" />
        ) : null}
      </div>
    );
  },
);
TypographyBodyCard.displayName = "TypographyBodyCard";
