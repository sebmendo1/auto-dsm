"use client";

import type { ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background-elevated p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
            {description ? (
              <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
