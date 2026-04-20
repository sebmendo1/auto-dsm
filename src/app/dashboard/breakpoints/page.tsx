"use client";

import * as React from "react";
import { Sparkles, Smartphone, Tablet, Monitor } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

function deviceForPx(px: number) {
  if (px < 640) return { icon: Smartphone, label: "Mobile" };
  if (px < 1024) return { icon: Tablet, label: "Tablet" };
  return { icon: Monitor, label: "Desktop" };
}

export default function BreakpointsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.breakpoints.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Breakpoints</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Responsive breakpoints used across your UI.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No breakpoints detected"
            description="We didn't find any breakpoint tokens in this repo."
          />
        </div>
      </div>
    );
  }

  const sorted = [...profile.breakpoints].sort((a, b) => a.px - b.px);
  const maxPx = sorted[sorted.length - 1]?.px ?? 1536;
  const source =
    profile.meta.tailwindConfigPath ||
    profile.meta.cssSource ||
    "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <h1 className="text-h1 text-[var(--text-primary)]">Breakpoints</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Responsive breakpoints scaled against the largest. Use these media query thresholds in CSS and Tailwind.
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        <Sparkles size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
        <span
          className="text-[var(--text-tertiary)]"
          style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12 }}
        >
          Auto-extracted from {source}
        </span>
      </div>

      <div className="mt-10 space-y-3">
        {sorted.map((bp) => {
          const Device = deviceForPx(bp.px);
          const widthPct = (bp.px / maxPx) * 100;
          const mediaQuery = `@media (min-width: ${bp.value})`;
          return (
            <div
              key={bp.name}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32 shrink-0">
                  <Device.icon size={16} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
                  <div>
                    <div
                      className="text-[var(--text-primary)] font-medium"
                      style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
                    >
                      {bp.name}
                    </div>
                    <div
                      className="text-[var(--text-tertiary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                    >
                      {Device.label}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="h-3 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>

                <div className="w-28 shrink-0 text-right">
                  <div
                    className="text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14 }}
                  >
                    {bp.px}px
                  </div>
                  <div
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {bp.value}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1">
                <span
                  className="text-[var(--text-tertiary)] break-all flex-1"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  {mediaQuery}
                </span>
                <CopyButton value={mediaQuery} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
