"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import { TokenRow } from "@/components/dashboard/token-row";

export default function ZIndexPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.zIndex.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Z-Index"
          description="Stacking order tokens in your UI."
        />
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
      <PageHeader
        title="Z-Index"
        description="Stacking order scale visualized as layered planes. Higher values stack on top."
        source={source}
        count={sorted.length}
      />

      {/* Section 1: Stacking viz */}
      <div className="mt-12">
        <SectionHeading>Stacking Order</SectionHeading>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-8">
          <Eyebrow>PREVIEW</Eyebrow>
          <div className="mt-4 relative h-[280px] flex items-center justify-center">
            {sorted.map((z, i) => {
              const offset = i * 16;
              return (
                <div
                  key={z.name}
                  className="absolute w-[200px] h-[120px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] flex items-center justify-between px-4"
                  style={{
                    top: `calc(50% - 60px + ${offset}px)`,
                    left: `calc(50% - 100px - ${offset}px)`,
                    boxShadow:
                      "0 10px 24px -8px rgba(0,0,0,0.35), 0 2px 6px -2px rgba(0,0,0,0.25)",
                    zIndex: i + 1,
                  }}
                >
                  <span
                    className="text-[var(--text-primary)]"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {z.name}
                  </span>
                  <span
                    className="text-[var(--accent)]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 12,
                    }}
                  >
                    z-{z.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Tokens */}
      <div className="mt-14">
        <SectionHeading count={sorted.length}>Tokens</SectionHeading>

        {sorted.map((z) => {
          const cls = `z-${z.name}`;
          return (
            <TokenRow
              key={z.name}
              previewWidth={56}
              preview={
                <div
                  className="w-11 h-11 rounded-md bg-[var(--accent-subtle)] border border-[var(--border-default)] flex items-center justify-center"
                >
                  <span
                    className="text-[var(--accent)]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {z.value}
                  </span>
                </div>
              }
              name={z.name}
              meta={z.inferredRole ?? "—"}
              submeta={z.isCustom ? `custom · ${z.source}` : z.source}
              copyables={[
                { eyebrow: "Z", label: "value", value: String(z.value) },
                { eyebrow: "CLASS", label: "tailwind class", value: cls },
              ]}
            />
          );
        })}
      </div>
    </div>
  );
}
