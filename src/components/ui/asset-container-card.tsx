import * as React from "react";
import { cn } from "@/lib/utils";
import { brandCardPaper, brandTokenSurface } from "@/components/ui/brand-card-tokens";

export interface AssetContainerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main preview (image, icon, or placeholder). */
  preview: React.ReactNode;
  /** First footer line. */
  label?: React.ReactNode;
  /** Second line, muted. */
  footerLine?: React.ReactNode;
  /** Full footer override (if set, `label` / `footerLine` ignored). */
  footer?: React.ReactNode;
  /** Inner preview area classes (default `h-[140px]` from ref). */
  previewClassName?: string;
}

/**
 * Asset preview card: light shell, paper preview block, two-line footer (second line 70% opacity like ref).
 */
export const AssetContainerCard = React.forwardRef<HTMLDivElement, AssetContainerCardProps>(
  (
    {
      className,
      preview,
      label,
      footerLine,
      footer,
      previewClassName,
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
        <div
          className={cn(
            "min-h-0 w-full min-w-0 overflow-hidden",
            "rounded-2xl",
            brandCardPaper,
            "h-[140px] flex items-center justify-center p-0",
            previewClassName,
          )}
        >
          {preview}
        </div>
        {footer != null ? (
          <div className="mt-3">{footer}</div>
        ) : label != null || footerLine != null ? (
          <div className="mt-3 space-y-0.5">
            {label != null ? (
              <p className="text-[12px] leading-tight text-[var(--text-primary)]">{label}</p>
            ) : null}
            {footerLine != null ? (
              <p className="text-[12px] leading-tight text-[var(--text-primary)] opacity-70">
                {footerLine}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
AssetContainerCard.displayName = "AssetContainerCard";
