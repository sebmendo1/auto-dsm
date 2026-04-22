"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/dashboard/page-header";
import { TokenCard } from "@/components/dashboard/token-card";

export default function AnimationsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [allTick, setAllTick] = React.useState(0);
  const [ticks, setTicks] = React.useState<Record<string, number>>({});

  function replay(key: string) {
    setTicks((t) => ({ ...t, [key]: (t[key] ?? 0) + 1 }));
  }

  if (!profile || profile.animations.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Animations"
          description="Keyframes and transition timings used in your UI."
        />
        <div className="mt-10">
          <EmptyState
            title="No animations detected"
            description="We didn't find any keyframes or transition tokens in this repo."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Animations"
        description="Keyframes and transition timings used in your UI. Click any card to replay, or play them all at once."
        source={source}
        count={profile.animations.length}
        actions={
          <button
            type="button"
            onClick={() => setAllTick((t) => t + 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            <Play size={12} strokeWidth={1.5} />
            Play all
          </button>
        }
      />

      <div className="mt-12">
        <SectionHeading count={profile.animations.length}>
          Motion Tokens
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profile.animations.map((anim, i) => {
            const key = `${anim.name}-${i}`;
            const tick = (ticks[key] ?? 0) + allTick;
            const cssValue =
              anim.type === "keyframes"
                ? `${anim.name} ${anim.duration} ${anim.timingFunction}${
                    anim.delay ? ` ${anim.delay}` : ""
                  }`
                : `${anim.duration} ${anim.timingFunction}`;

            return (
              <TokenCard
                key={key}
                previewHeight={112}
                previewPadding="p-0"
                preview={
                  <div
                    key={`preview-${key}-${tick}`}
                    className="w-10 h-10 rounded-lg bg-[var(--accent)]"
                    style={
                      anim.type === "keyframes"
                        ? {
                            animation: `${anim.name} ${anim.duration} ${anim.timingFunction}${
                              anim.delay ? ` ${anim.delay}` : ""
                            } both`,
                          }
                        : {
                            transition: `transform ${anim.duration} ${anim.timingFunction}`,
                            transform:
                              tick % 2 === 0
                                ? "translateX(-60px)"
                                : "translateX(60px)",
                          }
                    }
                  />
                }
                title={anim.name}
                subtitle={`${anim.type}${
                  anim.tailwindClass ? ` · ${anim.tailwindClass}` : ""
                } · ${anim.source}`}
                headerRight={
                  <button
                    type="button"
                    onClick={() => replay(key)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-150 [transition-timing-function:var(--ease-standard)]"
                    style={{ fontFamily: "var(--font-geist-sans)" }}
                    aria-label={`Replay ${anim.name}`}
                  >
                    <Play size={12} strokeWidth={1.5} />
                    Replay
                  </button>
                }
                specs={[
                  { label: "DURATION", value: anim.duration },
                  { label: "EASING", value: anim.timingFunction },
                  ...(anim.delay
                    ? [{ label: "DELAY", value: anim.delay }]
                    : []),
                  ...(anim.isCustom
                    ? [{ label: "CUSTOM", value: "yes", mono: false }]
                    : []),
                ]}
                copyables={[
                  { eyebrow: "CSS", label: "shorthand", value: cssValue },
                  ...(anim.tailwindClass
                    ? [
                        {
                          eyebrow: "CLASS",
                          label: "tailwind class",
                          value: anim.tailwindClass,
                        },
                      ]
                    : []),
                ]}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
