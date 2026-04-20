import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-[var(--font-geist-sans)] font-medium",
    "transition-[background-color,color,border-color,box-shadow] duration-150",
    "[transition-timing-function:var(--ease-standard)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-pressed)]",
        secondary:
          "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]",
        ghost:
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
        outline:
          "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
        danger:
          "bg-[var(--error)] text-white hover:opacity-90",
        link: "text-[var(--accent)] hover:underline underline-offset-4 p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-[13px] rounded-[8px]",
        md: "h-9 px-3.5 text-[14px] rounded-[8px]",
        lg: "h-11 px-5 text-[14px] rounded-[8px]",
        xl: "h-14 px-6 text-[15px] rounded-full",
        icon: "h-9 w-9 rounded-[8px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
