"use client";

import * as React from "react";
import { Droplets } from "lucide-react";
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

const CHECKERBOARD = `repeating-conic-gradient(
  var(--border-subtle) 0% 25%,
  transparent 0% 50%
) 50% / 12px 12px`;

const HERO_DESC =
  "Opacity scale used across your UI. Previews on a checkerboard to reveal transparency.";

export default function OpacityPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.opacity.length === 0) {
    return (
      <BrandTokenPageLayout
        hero={
          <BrandTokenPageHero
            title="Opacity"
            description="Opacity scale values from your theme."
            icon={
              <Droplets size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
            }
          />
        }
        metaRight={profile?.scannedAt ? <LastUpdatedLabel scannedAt={profile.scannedAt} /> : undefined}
      >
        <EmptyState
          title="No opacity tokens detected"
          description="We didn't find any opacity values in this repo."
        />
      </BrandTokenPageLayout>
    );
  }

  const sorted = [...profile.opacity].sort((a, b) => a.value - b.value);
  const source = profile.meta.tailwindConfigPath || profile.meta.cssSource || "repo";

  return (
    <BrandTokenPageLayout
      hero={
        <BrandTokenPageHero
          title="Opacity"
          description={HERO_DESC}
          icon={<Droplets size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />}
        />
      }
      metaRight={<LastUpdatedLabel scannedAt={profile.scannedAt} />}
    >
      <div className="space-y-6">
        <TokenPageProvenanceLine>Auto-extracted from {source}</TokenPageProvenanceLine>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {sorted.map((op) => {
          const className = `opacity-${op.name}`;
          return (
            <div
              key={op.name}
              className={cn(brandTokenSurface, "overflow-hidden")}
            >
              <div
                className="relative h-24"
                style={{ background: CHECKERBOARD }}
              >
                <div
                  className="absolute inset-0 bg-[var(--accent)]"
                  style={{ opacity: op.value }}
                />
              </div>
              <div className="p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <div
                    className="font-medium text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13 }}
                  >
                    {op.name}
                  </div>
                  <div
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {op.percentage}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span
                    className="flex-1 truncate text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {className}
                  </span>
                  <CopyButton value={className} iconSize={12} />
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </BrandTokenPageLayout>
  );
}
