import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-xl border-0 [background:unset] shadow-none",
        "px-8 py-16",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-[var(--text-tertiary)]">{icon}</div>
      ) : null}
      <p className="text-h3 text-[var(--text-primary)]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-body-s text-[var(--text-secondary)]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
