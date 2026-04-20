"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function GradientsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.gradients.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Gradients</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Gradient definitions used throughout your UI.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No gradients detected"
            description="We didn't find any gradient tokens in this repo's CSS or config."
          />
        </div>
      </div>
    );
  }

  const source = profile.meta.cssSource || profile.meta.tailwindConfigPath || "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <h1 className="text-h1 text-[var(--text-primary)]">Gradients</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Gradients extracted from your theme. Each card shows the preview, stops, and CSS value.
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

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {profile.gradients.map((g, i) => (
          <div
            key={`${g.name}-${i}`}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden"
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
  );
}
