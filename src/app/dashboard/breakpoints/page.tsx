"use client";

import * as React from "react";
import { MonitorSmartphone, Smartphone, Tablet, Monitor } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BrandTokenPageHero,
  BrandTokenPageLayout,
  LastUpdatedLabel,
  TokenPageProvenanceLine,
} from "@/components/dashboard/brand-token-page-layout";
import { brandTokenSurface } from "@/components/ui/brand-card-tokens";
import { cn } from "@/lib/utils";

function deviceForPx(px: number) {
  if (px < 640) return { icon: Smartphone, label: "Mobile" };
  if (px < 1024) return { icon: Tablet, label: "Tablet" };
  return { icon: Monitor, label: "Desktop" };
}

const HERO_DESC =
  "Responsive breakpoints used across your UI. Values are scaled against the largest width—use them as single sources of truth for media queries and Tailwind.";

export default function BreakpointsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.breakpoints.length === 0) {
    return (
      <BrandTokenPageLayout
        hero={
          <BrandTokenPageHero
            title="Breakpoints"
            description="Responsive breakpoints used across your UI."
            icon={
              <MonitorSmartphone
                size={20}
                strokeWidth={1.75}
                className="shrink-0"
                aria-hidden
              />
            }
          />
        }
        metaRight={profile?.scannedAt ? <LastUpdatedLabel scannedAt={profile.scannedAt} /> : undefined}
      >
        <EmptyState
          title="No breakpoints detected"
          description="We didn't find any breakpoint tokens in this repo."
        />
      </BrandTokenPageLayout>
    );
  }

  const sorted = [...profile.breakpoints].sort((a, b) => a.px - b.px);
  const maxPx = sorted[sorted.length - 1]?.px ?? 1536;
  const source =
    profile.meta.tailwindConfigPath ||
    profile.meta.cssSource ||
    "repo";

  return (
    <BrandTokenPageLayout
      hero={
        <BrandTokenPageHero
          title="Breakpoints"
          description={HERO_DESC}
          icon={
            <MonitorSmartphone
              size={20}
              strokeWidth={1.75}
              className="shrink-0"
              aria-hidden
            />
          }
        />
      }
      metaRight={<LastUpdatedLabel scannedAt={profile.scannedAt} />}
    >
      <div className="space-y-6">
        <TokenPageProvenanceLine>Auto-extracted from {source}</TokenPageProvenanceLine>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sorted.map((bp) => {
          const Device = deviceForPx(bp.px);
          const widthPct = (bp.px / maxPx) * 100;
          const mediaQuery = `@media (min-width: ${bp.value})`;
          return (
            <div
              key={bp.name}
              className={cn(brandTokenSurface, "p-5")}
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
    </BrandTokenPageLayout>
  );
}
