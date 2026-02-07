import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60";

const variants: Record<"primary" | "secondary" | "ghost", string> = {
  primary: "bg-foreground text-background hover:bg-foreground/90",
  secondary:
    "bg-background-elevated text-foreground border border-border hover:bg-background-tertiary hover:border-border-hover",
  ghost: "text-foreground border border-border hover:bg-background-tertiary",
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
