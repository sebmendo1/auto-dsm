"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading } from "@/components/dashboard/page-header";
import { TokenCard } from "@/components/dashboard/token-card";

export default function GradientsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.gradients.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Gradients"
          description="Gradient definitions used throughout your UI."
        />
        <div className="mt-10">
          <EmptyState
            title="No gradients detected"
            description="We didn't find any gradient tokens in this repo's CSS or config."
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
        title="Gradients"
        description="Gradients extracted from your theme. Each card shows the preview, color stops, and copy-ready CSS."
        source={source}
        count={profile.gradients.length}
      />

      <div className="mt-12">
        <SectionHeading count={profile.gradients.length}>
          Gradient Tokens
        </SectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {profile.gradients.map((g, i) => (
            <TokenCard
              key={`${g.name}-${i}`}
              previewHeight={148}
              previewPadding="p-0"
              preview={<div className="w-full h-full" style={{ background: g.cssValue }} />}
              title={g.name}
              subtitle={
                <>
                  {g.type}
                  {g.direction ? ` · ${g.direction}` : ""} · {g.source}
                </>
              }
              copyables={[
                { eyebrow: "CSS", label: "css value", value: g.cssValue },
              ]}
            >
              {/* Color stops */}
              {g.stops.length > 0 ? (
                <div className="mt-4">
                  <div
                    className="text-[var(--text-placeholder)] uppercase tracking-[0.04em] mb-1.5"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                    }}
                  >
                    STOPS
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {g.stops.map((s, si) => (
                      <div
                        key={si}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-2 py-1"
                      >
                        <div
                          className="w-3 h-3 rounded-sm border border-[var(--border-default)]"
                          style={{ backgroundColor: s.colorHex }}
                        />
                        <span
                          className="text-[var(--text-secondary)]"
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 11,
                          }}
                        >
                          {s.colorHex}
                          {s.position ? ` ${s.position}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </TokenCard>
          ))}
        </div>
      </div>
    </div>
  );
}
