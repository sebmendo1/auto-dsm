import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-background-elevated p-4 transition-colors hover:border-border-hover ${className}`}
      {...props}
    />
  );
}
