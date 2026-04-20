"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

const CHECKERBOARD = `repeating-conic-gradient(
  var(--border-subtle) 0% 25%,
  transparent 0% 50%
) 50% / 12px 12px`;

export default function OpacityPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.opacity.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Opacity</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Opacity scale values from your theme.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No opacity tokens detected"
            description="We didn't find any opacity values in this repo."
          />
        </div>
      </div>
    );
  }

  const sorted = [...profile.opacity].sort((a, b) => a.value - b.value);
  const source = profile.meta.tailwindConfigPath || profile.meta.cssSource || "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <h1 className="text-h1 text-[var(--text-primary)]">Opacity</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Opacity scale used across your UI. Previews on a checkerboard to reveal transparency.
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

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sorted.map((op) => {
          const className = `opacity-${op.name}`;
          return (
            <div
              key={op.name}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden"
            >
              <div
                className="h-24 relative"
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
                    className="text-[var(--text-primary)] font-medium"
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
                    className="text-[var(--text-tertiary)] flex-1 truncate"
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
  );
}
