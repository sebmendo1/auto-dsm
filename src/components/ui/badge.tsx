import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[8px] border px-2 py-0.5 text-[12px] font-medium leading-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-tertiary)] border-[var(--border-default)] text-[var(--text-secondary)]",
        accent:
          "bg-[var(--accent-subtle)] border-transparent text-[var(--accent)]",
        success:
          "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] border-transparent text-[var(--success)]",
        warning:
          "bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] border-transparent text-[var(--warning)]",
        error:
          "bg-[color-mix(in_srgb,var(--error)_14%,transparent)] border-transparent text-[var(--error)]",
        outline:
          "bg-transparent border-[var(--border-default)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
