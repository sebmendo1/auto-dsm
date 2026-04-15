import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-delicate border border-border bg-background-elevated p-4 shadow-sm transition-[border-color,box-shadow] hover:border-border-hover hover:shadow-md dark:shadow-none ${className}`}
      {...props}
    />
  );
}
