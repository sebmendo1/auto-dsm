"use client";

import * as React from "react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeading, Eyebrow } from "@/components/dashboard/page-header";
import { TokenRow } from "@/components/dashboard/token-row";

export default function SpacingPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.spacing.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <PageHeader
          title="Spacing"
          description="The spacing scale used for padding, margin, and gaps."
        />
        <div className="mt-10">
          <EmptyState
            title="No spacing detected"
            description="We didn't find any spacing tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  const sorted = [...profile.spacing].sort((a, b) => a.px - b.px);
  const maxPx = Math.max(...sorted.map((s) => s.px), 1);

  // For applied examples: pick sp-2 and sp-4 (or fall back to small/medium tokens)
  const byName: Record<string, (typeof sorted)[number]> = {};
  for (const s of sorted) byName[s.name] = s;
  const sp4 = byName["4"] ?? sorted[Math.min(3, sorted.length - 1)];
  const sp2 = byName["2"] ?? sorted[Math.min(1, sorted.length - 1)];
  const sp6 = byName["6"] ?? sorted[Math.min(5, sorted.length - 1)];

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <PageHeader
        title="Spacing"
        description="The spacing scale used for padding, margin, and gaps."
        source={source}
        count={sorted.length}
      />

      {/* ── Section 1: Scale ── */}
      <div className="mt-12">
        <SectionHeading count={sorted.length}>Spacing Scale</SectionHeading>
        <div>
          {sorted.map((s) => (
            <TokenRow
              key={s.name}
              previewWidth={160}
              preview={
                <div className="w-full h-6 relative flex items-center">
                  <div
                    className="h-1.5 rounded-full bg-[var(--border-default)] w-full"
                  />
                  <div
                    className="absolute left-0 h-1.5 rounded-full bg-[var(--accent)]"
                    style={{
                      width: `${(s.px / maxPx) * 100}%`,
                      minWidth: s.px > 0 ? 2 : 0,
                    }}
                  />
                </div>
              }
              name={s.name}
              meta={s.tailwindClass}
              submeta={s.isCustom ? `custom · ${s.source}` : s.source}
              copyables={[
                { eyebrow: "PX", label: "pixels", value: `${s.px}px` },
                { eyebrow: "REM", label: "rem", value: s.rem },
                { eyebrow: "CLASS", label: "tailwind class", value: s.tailwindClass },
              ]}
            />
          ))}
        </div>
      </div>

      {/* ── Section 2: Applied Examples (2-col max grid) ── */}
      <div className="mt-14">
        <SectionHeading>Applied Examples</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Padding */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <Eyebrow>PADDING · p-{sp4?.name ?? "4"}</Eyebrow>
            <div
              className="mt-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]"
              style={{ padding: sp4?.rem ?? "1rem" }}
            >
              <div
                className="rounded-md bg-[var(--accent-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] text-body-s px-3 py-2"
              >
                Inner content · {sp4?.rem ?? "1rem"} padding applied
              </div>
            </div>
            <div
              className="text-[var(--text-tertiary)] mt-3"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            >
              {sp4?.rem ?? "1rem"} = {sp4?.px ?? 16}px
            </div>
          </div>

          {/* Gap stack */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <Eyebrow>VERTICAL GAP · gap-{sp2?.name ?? "2"}</Eyebrow>
            <div
              className="mt-3 flex flex-col"
              style={{ gap: sp2?.rem ?? "0.5rem" }}
            >
              {["Card A", "Card B", "Card C"].map((label) => (
                <div
                  key={label}
                  className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] px-3 py-2 text-[var(--text-secondary)] text-body-s"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="text-[var(--text-tertiary)] mt-3"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            >
              gap: {sp2?.rem ?? "0.5rem"}
            </div>
          </div>

          {/* Horizontal rhythm */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <Eyebrow>HORIZONTAL RHYTHM · gap-{sp6?.name ?? "6"}</Eyebrow>
            <div
              className="mt-3 flex items-center"
              style={{ gap: sp6?.rem ?? "1.5rem" }}
            >
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-10 h-10 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div
              className="text-[var(--text-tertiary)] mt-3"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            >
              gap: {sp6?.rem ?? "1.5rem"}
            </div>
          </div>

          {/* Button rhythm */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <Eyebrow>
              BUTTON · px-{sp4?.name ?? "4"} py-{sp2?.name ?? "2"}
            </Eyebrow>
            <div className="mt-3 flex items-center gap-3">
              <button
                className="rounded-md bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-medium"
                style={{
                  paddingLeft: sp4?.rem ?? "1rem",
                  paddingRight: sp4?.rem ?? "1rem",
                  paddingTop: sp2?.rem ?? "0.5rem",
                  paddingBottom: sp2?.rem ?? "0.5rem",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Primary action
              </button>
              <button
                className="rounded-md border border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[13px] font-medium"
                style={{
                  paddingLeft: sp4?.rem ?? "1rem",
                  paddingRight: sp4?.rem ?? "1rem",
                  paddingTop: sp2?.rem ?? "0.5rem",
                  paddingBottom: sp2?.rem ?? "0.5rem",
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                Secondary
              </button>
            </div>
            <div
              className="text-[var(--text-tertiary)] mt-3"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
            >
              {sp4?.rem ?? "1rem"} / {sp2?.rem ?? "0.5rem"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
