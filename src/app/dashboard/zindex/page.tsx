"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ZIndexPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.zIndex.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Z-Index</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Stacking order tokens in your UI.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No z-index tokens detected"
            description="We didn't find any z-index tokens in this repo."
          />
        </div>
      </div>
    );
  }

  const sorted = [...profile.zIndex].sort((a, b) => a.value - b.value);
  const source = profile.meta.tailwindConfigPath || profile.meta.cssSource || "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <h1 className="text-h1 text-[var(--text-primary)]">Z-Index</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Stacking order scale visualized as layered planes. Higher values stack on top.
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

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
        {/* Stacking diagram */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
          <div
            className="text-[var(--text-tertiary)] mb-4"
            style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
          >
            STACKING PREVIEW
          </div>
          <div className="relative h-[280px] flex items-end justify-center">
            {sorted.map((z, i) => {
              const offset = i * 14;
              return (
                <div
                  key={z.name}
                  className="absolute w-48 h-32 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] flex items-center justify-center"
                  style={{
                    bottom: `${offset}px`,
                    right: `${offset + 40}px`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  <span
                    className="text-[var(--text-secondary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                  >
                    z-{z.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="space-y-0">
          {sorted.map((z) => {
            const cls = `z-${z.name}`;
            return (
              <div
                key={z.name}
                className="flex items-center gap-4 py-4 border-b border-[var(--border-subtle)]"
              >
                <div className="w-10 text-right shrink-0">
                  <span
                    className="text-[var(--accent)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14 }}
                  >
                    {z.value}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[var(--text-primary)] font-medium"
                    style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
                  >
                    {z.name}
                  </div>
                  {z.inferredRole && (
                    <div
                      className="text-[var(--text-tertiary)]"
                      style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12 }}
                    >
                      {z.inferredRole}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                  >
                    {cls}
                  </span>
                  <CopyButton value={cls} iconSize={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
