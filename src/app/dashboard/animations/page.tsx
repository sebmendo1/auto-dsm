"use client";

import * as React from "react";
import { Sparkles, Play } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AnimationsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [tick, setTick] = React.useState(0);

  if (!profile || profile.animations.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Animations</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Keyframes and transition timings used in your UI.
        </p>
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
      <h1 className="text-h1 text-[var(--text-primary)]">Animations</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Keyframes and transition timings used in your UI. Click replay to preview.
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

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        {profile.animations.map((anim, i) => {
          const cssValue =
            anim.type === "keyframes"
              ? `${anim.name} ${anim.duration} ${anim.timingFunction}${anim.delay ? ` ${anim.delay}` : ""}`
              : `${anim.duration} ${anim.timingFunction}`;
          return (
            <div
              key={`${anim.name}-${i}`}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
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
  );
}
