"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import { TokenRow } from "@/components/dashboard/token-row";

export default function RadiiPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.radii.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Radii"
          description="Border-radius tokens for rounded corners."
        />
        <div className="mt-10">
          <EmptyState
            title="No radii detected"
            description="We didn't find any border-radius tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  const sorted = [...profile.radii].sort((a, b) => a.px - b.px);

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Radii"
        description="Border-radius tokens for rounded corners. Previewed against common UI elements so you can see how each value feels in context."
        source={source}
        count={sorted.length}
      />

      {/* Section 1: Progression */}
      <div className="mt-12">
        <SectionHeading count={sorted.length}>Radius Progression</SectionHeading>
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-8">
          <div className="flex flex-wrap gap-10 items-end">
            {sorted.map((radius) => (
              <div
                key={radius.name}
                className="flex flex-col items-center gap-3"
              >
                <div
                  className="w-16 h-16 border border-[var(--border-default)]"
                  style={{
                    borderRadius: radius.value,
                    backgroundColor: "var(--accent-subtle)",
                  }}
                />
                <div className="text-center">
                  <div
                    className="text-[var(--text-primary)]"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {radius.name}
                  </div>
                  <div
                    className="text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                    }}
                  >
                    {radius.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Applied examples — 2-col grid */}
      <div className="mt-14">
        <SectionHeading>Applied Examples</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((r) => (
            <div
              key={r.name}
              className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5"
            >
              <div className="flex items-baseline justify-between">
                <div
                  className="text-[var(--text-primary)] font-medium"
                  style={{
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: 14,
                  }}
                >
                  {r.name}
                </div>
                <Eyebrow>{r.tailwindClass}</Eyebrow>
              </div>
              <div className="mt-4 flex items-stretch gap-3">
                <button
                  className="h-9 px-3 bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-medium shrink-0"
                  style={{
                    borderRadius: r.value,
                    fontFamily: "var(--font-geist-sans)",
                  }}
                >
                  Button
                </button>
                <input
                  readOnly
                  placeholder="Input"
                  className="flex-1 min-w-0 h-9 px-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-placeholder)] outline-none"
                  style={{
                    borderRadius: r.value,
                    fontFamily: "var(--font-geist-sans)",
                  }}
                />
                <div
                  className="w-9 h-9 bg-[var(--bg-secondary)] border border-[var(--border-default)] shrink-0"
                  style={{ borderRadius: r.value }}
                />
              </div>
              <div
                className="mt-3 text-[var(--text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
              >
                {r.value} · {r.px}px
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Detail rows */}
      <div className="mt-14">
        <SectionHeading>Token Details</SectionHeading>
        {sorted.map((radius) => (
          <TokenRow
            key={radius.name}
            previewWidth={56}
            preview={
              <div
                className="w-12 h-12 border border-[var(--border-default)]"
                style={{
                  borderRadius: radius.value,
                  backgroundColor: "var(--accent-subtle)",
                }}
              />
            }
            name={radius.name}
            meta={radius.tailwindClass}
            submeta={radius.isCustom ? `custom · ${radius.source}` : radius.source}
            copyables={[
              { eyebrow: "PX", label: "pixels", value: `${radius.px}px` },
              { eyebrow: "CSS", label: "value", value: radius.value },
              {
                eyebrow: "CLASS",
                label: "tailwind class",
                value: radius.tailwindClass,
              },
              ...(radius.cssVariable
                ? [
                    {
                      eyebrow: "VAR",
                      label: "css variable",
                      value: radius.cssVariable,
                    },
                  ]
                : []),
            ]}
          />
        ))}
      </div>
    </div>
  );
}
