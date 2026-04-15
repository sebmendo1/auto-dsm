import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex min-h-control items-center justify-center gap-2 rounded-delicate px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variants: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "bg-brand text-white shadow-sm hover:opacity-90",
  secondary:
    "border border-border bg-background-elevated text-foreground shadow-sm hover:bg-background-tertiary hover:border-border-hover",
  ghost: "text-foreground hover:bg-background-tertiary",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
