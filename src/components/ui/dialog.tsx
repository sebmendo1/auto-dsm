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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-[1px]">
      <div className="w-full max-w-lg rounded-delicate border border-border bg-background-elevated p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-lg font-semibold leading-snug text-foreground">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-foreground-secondary">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-delicate p-2 text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
