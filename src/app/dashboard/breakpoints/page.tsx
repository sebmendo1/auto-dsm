"use client";

import * as React from "react";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import { TokenRow } from "@/components/dashboard/token-row";

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
        <PageHeader
          title="Breakpoints"
          description="Responsive breakpoints used across your UI."
        />
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
      <PageHeader
        title="Breakpoints"
        description="Responsive breakpoints scaled against the largest. Use these media query thresholds in CSS and Tailwind."
        source={source}
        count={sorted.length}
      />

      {/* Section 1: Ruler */}
      <div className="mt-12">
        <SectionHeading>Breakpoint Ruler</SectionHeading>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
          <Eyebrow>SCALE · 0 → {maxPx}px</Eyebrow>
          <div className="mt-5 relative h-12">
            <div className="absolute inset-x-0 top-5 h-1.5 rounded-full bg-[var(--bg-tertiary)]" />
            {sorted.map((bp) => {
              const leftPct = (bp.px / maxPx) * 100;
              return (
                <div
                  key={bp.name}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${leftPct}%`, top: 0 }}
                >
                  <div className="w-[2px] h-3 bg-[var(--accent)] mx-auto" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] mx-auto -mt-[1px]" />
                  <div
                    className="mt-2 text-center text-[var(--text-secondary)]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                    }}
                  >
                    {bp.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Token rows */}
      <div className="mt-14">
        <SectionHeading count={sorted.length}>Tokens</SectionHeading>
        {sorted.map((bp) => {
          const Device = deviceForPx(bp.px);
          const widthPct = (bp.px / maxPx) * 100;
          const mediaQuery = `@media (min-width: ${bp.value})`;
          return (
            <TokenRow
              key={bp.name}
              previewWidth={180}
              preview={
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Device.icon
                      size={14}
                      strokeWidth={1.5}
                      className="text-[var(--text-tertiary)]"
                    />
                    <span
                      className="text-[var(--text-tertiary)]"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 11,
                      }}
                    >
                      {Device.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              }
              name={bp.name}
              meta={`${bp.px}px · ${bp.value}`}
              submeta={bp.isCustom ? `custom · ${bp.source}` : bp.source}
              copyables={[
                { eyebrow: "PX", label: "pixels", value: `${bp.px}px` },
                { eyebrow: "CSS", label: "value", value: bp.value },
                { eyebrow: "MEDIA", label: "media query", value: mediaQuery },
              ]}
            />
          );
        })}
      </div>
    </div>
  );
}
