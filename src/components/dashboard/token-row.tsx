"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

/**
 * Linear-style minimal token row. No card chrome — just a bottom rule.
 * Hover reveals a subtle secondary-surface background and the copy affordances.
 *
 *   <TokenRow
 *     preview={<Swatch/>}
 *     name="primary"
 *     meta="globals.css:14"
 *     copyables={[{ label: "value", value: "#8F23FA" }, { label: "class", value: "bg-primary" }]}
 *   />
 */
export interface Copyable {
  label: string;
  value: string;
  /** Optional — overrides the default rendering of the value text. */
  display?: React.ReactNode;
  /** Small muted eyebrow shown above the value (e.g. "CSS", "TAILWIND"). */
  eyebrow?: string;
}

export interface TokenRowProps {
  /** Visual preview on the left (e.g. color swatch, radius square). Fixed 72×72 by default. */
  preview: React.ReactNode;
  /** Fixed width of the preview column. Defaults to 72. */
  previewWidth?: number | string;
  /** Primary token name. */
  name: string;
  /** Subtle second line (Tailwind class, source path, etc). */
  meta?: React.ReactNode;
  /** Tertiary third line, shown in mono type-face. */
  submeta?: React.ReactNode;
  /** One or more copyable value groups displayed on the right. */
  copyables?: Copyable[];
  /** Optional right-side content that replaces the default copyables column. */
  right?: React.ReactNode;
  /** Adds extra right-side spec content below the copyables. */
  rightExtra?: React.ReactNode;
  className?: string;
}

export function TokenRow({
  preview,
  previewWidth = 72,
  name,
  meta,
  submeta,
  copyables,
  right,
  rightExtra,
  className,
}: TokenRowProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-6 py-4 border-b border-[var(--border-subtle)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)] hover:bg-[var(--bg-secondary)] -mx-3 px-3 rounded-lg",
        className,
      )}
    >
      {/* Preview */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: previewWidth, height: previewWidth }}
      >
        {preview}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[var(--text-primary)] font-medium truncate"
          style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
        >
          {name}
        </div>
        {meta ? (
          <div
            className="text-[var(--text-tertiary)] mt-0.5 truncate"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
          >
            {meta}
          </div>
        ) : null}
        {submeta ? (
          <div
            className="text-[var(--text-tertiary)] mt-0.5 truncate"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
          >
            {submeta}
          </div>
        ) : null}
      </div>

      {/* Right-side */}
      {right ? (
        <div className="shrink-0">{right}</div>
      ) : copyables && copyables.length > 0 ? (
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5 max-w-[60%]">
          {copyables.map((c) => (
            <div
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-code)] border border-[var(--border-subtle)] pl-2 pr-0.5 py-1 hover:border-[var(--border-default)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]"
            >
              {c.eyebrow ? (
                <span
                  className="text-[var(--text-placeholder)] uppercase tracking-[0.04em]"
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10,
                  }}
                >
                  {c.eyebrow}
                </span>
              ) : null}
              <span
                className="text-[var(--text-code)] max-w-[240px] truncate"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
              >
                {c.display ?? c.value}
              </span>
              <CopyButton
                value={c.value}
                label={c.label}
                iconSize={12}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100"
              />
            </div>
          ))}
          {rightExtra}
        </div>
      ) : null}
    </div>
  );
}

/** Thin divider used between row-groups. Uses the same border-subtle token. */
export function RowGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-t border-[var(--border-subtle)]", className)}>
      {children}
    </div>
  );
}
