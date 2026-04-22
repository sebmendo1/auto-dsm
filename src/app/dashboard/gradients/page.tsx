"use client";

import * as React from "react";
import { Paintbrush } from "lucide-react";
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

const HERO_DESC =
  "Gradients extracted from your theme. Each card shows the preview, color stops, and CSS value.";

export default function GradientsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.gradients.length === 0) {
    return (
      <BrandTokenPageLayout
        hero={
          <BrandTokenPageHero
            title="Gradients"
            description="Gradient definitions used throughout your UI."
            icon={
              <Paintbrush size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
            }
          />
        }
        metaRight={profile?.scannedAt ? <LastUpdatedLabel scannedAt={profile.scannedAt} /> : undefined}
      >
        <EmptyState
          title="No gradients detected"
          description="We didn't find any gradient tokens in this repo's CSS or config."
        />
      </BrandTokenPageLayout>
    );
  }

  const source = profile.meta.cssSource || profile.meta.tailwindConfigPath || "repo";

  return (
    <BrandTokenPageLayout
      hero={
        <BrandTokenPageHero
          title="Gradients"
          description={HERO_DESC}
          icon={<Paintbrush size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />}
        />
      }
      metaRight={<LastUpdatedLabel scannedAt={profile.scannedAt} />}
    >
      <div className="space-y-6">
        <TokenPageProvenanceLine>Auto-extracted from {source}</TokenPageProvenanceLine>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {profile.gradients.map((g, i) => (
          <div
            key={`${g.name}-${i}`}
            className={cn(brandTokenSurface, "overflow-hidden")}
          >
            <div
              className="h-36 w-full"
              style={{ background: g.cssValue }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div
                    className="text-[var(--text-primary)] font-medium"
                    style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
                  >
                    {g.name}
                  </div>
                  <div
                    className="text-[var(--text-tertiary)] mt-0.5"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {g.type}
                    {g.direction ? ` · ${g.direction}` : ""} · {g.source}
                  </div>
                </div>
              </div>

              {/* Stops */}
              <div className="mt-4 flex items-center gap-1.5 flex-wrap">
                {g.stops.map((s, si) => (
                  <div
                    key={si}
                    className="flex items-center gap-1.5 rounded-md bg-[var(--bg-primary)] px-2 py-1"
                  >
                    <div
                      className="w-3 h-3 rounded-sm border border-[var(--border-default)]"
                      style={{ backgroundColor: s.colorHex }}
                    />
                    <span
                      className="text-[var(--text-secondary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                    >
                      {s.colorHex}
                      {s.position ? ` ${s.position}` : ""}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1">
                <span
                  className="text-[var(--text-tertiary)] break-all flex-1"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                >
                  {g.cssValue}
                </span>
                <CopyButton value={g.cssValue} />
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </BrandTokenPageLayout>
  );
}
