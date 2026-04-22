"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

/**
 * Shared page header for every /dashboard/* category.
 * Matches the Colors + Typography aesthetic exactly so pages feel unified.
 *
 *   <PageHeader
 *     title="Shadows"
 *     description="Elevation tokens for cards, modals, and focus rings."
 *     source={profile.meta.cssSource}
 *     count={profile.shadows.length}
 *   />
 */
export interface PageHeaderProps {
  title: string;
  description: string;
  source?: string | null;
  /** Token count shown on the far right of the meta row. */
  count?: number;
  /** Optional right-aligned control (e.g. Light/Dark toggle on Colors page). */
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  source,
  count,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-h1 text-[var(--text-primary)]">{title}</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          {description}
        </p>
        <div className="mt-4 flex items-center flex-wrap gap-x-3 gap-y-1.5">
          {source ? (
            <div className="flex items-center gap-1.5">
              <Sparkles
                size={14}
                strokeWidth={1.5}
                className="text-[var(--text-tertiary)]"
              />
              <span
                className="text-[var(--text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12 }}
              >
                Auto-extracted from {source}
              </span>
            </div>
          ) : null}
          {typeof count === "number" ? (
            <>
              {source ? (
                <span
                  aria-hidden
                  className="text-[var(--text-placeholder)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                >
                  ·
                </span>
              ) : null}
              <span
                className="text-[var(--text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
              >
                {count} {count === 1 ? "token" : "tokens"}
              </span>
            </>
          ) : null}
        </div>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

/**
 * Section title identical to the ones rendered on Colors/Typography.
 *   <SectionHeading>Token Details <Count n={12}/></SectionHeading>
 */
export function SectionHeading({
  children,
  count,
  className = "",
}: {
  children: React.ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <h2
      className={`text-h2 text-[var(--text-primary)] mb-6 ${className}`}
    >
      {children}
      {typeof count === "number" ? (
        <span
          className="ml-2 text-[var(--text-tertiary)]"
          style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14 }}
        >
          {count}
        </span>
      ) : null}
    </h2>
  );
}

/** Tiny uppercase eyebrow used inside cards for spec labels. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[var(--text-tertiary)] uppercase tracking-[0.04em] ${className}`}
      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
    >
      {children}
    </div>
  );
}
