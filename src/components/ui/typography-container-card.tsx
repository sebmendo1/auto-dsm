import * as React from "react";
import { cn } from "@/lib/utils";
import { brandTokenSurface } from "@/components/ui/brand-card-tokens";
import {
  TypographyMetricPills,
  type TypographyMetricTabsTuple,
} from "@/components/ui/typography-metric-pills";

/** @deprecated Use `TypographyMetricTab` from `typography-metric-pills`; kept for call-site compatibility. */
export type TypographyContainerTab = TypographyMetricTabsTuple[number];

export interface TypographyContainerCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  displayText: React.ReactNode;
  /** H2 under the display; omit (with no `bodySample`) to show a single “Aa”-style block. */
  headingText?: React.ReactNode;
  /** Muted lorem / sample under heading. */
  bodySample?: React.ReactNode;
  /** Top header row: passed through to `TypographyBodyCard`-style layout for consistency. */
  eyebrow?: React.ReactNode;
  sampleLabel?: React.ReactNode;
  /** Exactly 3 spec pills. */
  tabs: TypographyMetricTabsTuple;
  displayClassName?: string;
  headingClassName?: string;
  bodyClassName?: string;
  /** Inline styles for the main preview (token-accurate size on typography page). */
  previewStyle?: React.CSSProperties;
  /** Element for preview line; use `div` when many previews on one page (a11y). */
  previewAs?: "h2" | "div";
  /** e.g. `Heading 1 sample` when `previewAs` is `div`. */
  previewAriaLabel?: string;
}

/**
 * Full typography preview: display line, optional H2 and body lorem, then three metric pills.
 * Composes the same header + body text styles as `TypographyBodyCard` for the lower sample block.
 */
export const TypographyContainerCard = React.forwardRef<
  HTMLDivElement,
  TypographyContainerCardProps
>(
  (
    {
      className,
      displayText,
      headingText,
      bodySample,
      eyebrow,
      sampleLabel,
      tabs,
      displayClassName,
      headingClassName,
      bodyClassName,
      previewStyle,
      previewAs = "h2",
      previewAriaLabel,
      ...props
    },
    ref,
  ) => {
    const hasTokenPreview = previewStyle != null && Object.keys(previewStyle).length > 0;
    const PreviewTag = previewAs;

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

        <PreviewTag
          className={cn(
            "font-inherit font-semibold leading-[1.1] tracking-tight text-[var(--text-primary)]",
            !hasTokenPreview &&
              "text-[2.2rem] sm:text-[2.5rem] md:text-[2.75rem]",
            displayClassName,
          )}
          style={hasTokenPreview ? previewStyle : undefined}
          {...(previewAriaLabel ? { "aria-label": previewAriaLabel } : {})}
        >
          {displayText}
        </PreviewTag>

        {headingText != null && (
          <h3
            className={cn(
              "mt-3 text-[1.1rem] font-semibold leading-snug text-[var(--text-primary)] sm:text-[1.2rem]",
              headingClassName,
            )}
          >
            {headingText}
          </h3>
        )}

        {bodySample != null && (
          <div
            className={cn(
              "mt-2 text-[15px] leading-[1.45] text-[var(--text-primary)]",
              bodyClassName,
            )}
          >
            {bodySample}
          </div>
        )}

        <TypographyMetricPills
          tabs={tabs}
          className={
            headingText != null || bodySample != null ? "mt-4 sm:mt-5" : "mt-4 sm:mt-6"
          }
        />
      </div>
    );
  },
);
TypographyContainerCard.displayName = "TypographyContainerCard";
