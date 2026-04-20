import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-9 w-full rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-3 text-[14px]",
          "text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)]",
          "transition-colors duration-150 [transition-timing-function:var(--ease-standard)]",
          "focus-visible:outline-none focus-visible:border-[var(--accent)]",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
