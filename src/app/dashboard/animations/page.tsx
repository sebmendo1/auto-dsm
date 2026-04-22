"use client";

import * as React from "react";
import { Clapperboard, Play } from "lucide-react";
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
  "Keyframes and transition timings used in your UI. Use Replay on each card to preview motion.";

export default function AnimationsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [tick, setTick] = React.useState(0);

  if (!profile || profile.animations.length === 0) {
    return (
      <BrandTokenPageLayout
        hero={
          <BrandTokenPageHero
            title="Animations"
            description="Keyframes and transition timings used in your UI."
            icon={
              <Clapperboard
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
          title="No animations detected"
          description="We didn't find any keyframes or transition tokens in this repo."
        />
      </BrandTokenPageLayout>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  return (
    <BrandTokenPageLayout
      hero={
        <BrandTokenPageHero
          title="Animations"
          description={HERO_DESC}
          icon={
            <Clapperboard
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {profile.animations.map((anim, i) => {
          const cssValue =
            anim.type === "keyframes"
              ? `${anim.name} ${anim.duration} ${anim.timingFunction}${anim.delay ? ` ${anim.delay}` : ""}`
              : `${anim.duration} ${anim.timingFunction}`;
          return (
            <div
              key={`${anim.name}-${i}`}
              className={cn(brandTokenSurface, "p-5")}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div
                    className="text-[var(--text-primary)] font-medium"
                    style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
                  >
                    {anim.name}
                  </div>
                  <div
                    className="text-[var(--text-tertiary)] mt-0.5"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    {anim.type} · {anim.source}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTick((t) => t + 1)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]"
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12 }}
                >
                  <Play size={12} strokeWidth={1.5} />
                  Replay
                </button>
              </div>

              <div className="mt-4 h-20 rounded-lg bg-[var(--bg-primary)] relative overflow-hidden flex items-center justify-center">
                <div
                  key={`preview-${i}-${tick}`}
                  className="w-10 h-10 rounded-lg bg-[var(--accent)]"
                  style={
                    anim.type === "keyframes"
                      ? {
                          animation: `${anim.name} ${anim.duration} ${anim.timingFunction}${anim.delay ? ` ${anim.delay}` : ""} both`,
                        }
                      : {
                          transition: `transform ${anim.duration} ${anim.timingFunction}`,
                          transform: tick % 2 === 0 ? "translateX(0)" : "translateX(60px)",
                        }
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
                  >
                    DURATION
                  </div>
                  <div
                    className="text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                  >
                    {anim.duration}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
                  >
                    EASING
                  </div>
                  <div
                    className="text-[var(--text-primary)] truncate"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                    title={anim.timingFunction}
                  >
                    {anim.timingFunction}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1">
                <span
                  className="text-[var(--text-tertiary)] break-all flex-1"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                >
                  {cssValue}
                </span>
                <CopyButton value={cssValue} />
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </BrandTokenPageLayout>
  );
}
