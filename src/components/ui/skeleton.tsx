import type { HTMLAttributes } from "react";

export function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-delicate bg-content-muted/15 dark:bg-content-muted/20 ${className}`}
      {...props}
    />
  );
}
