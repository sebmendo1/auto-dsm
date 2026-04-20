"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { EmptyState } from "@/components/ui/empty-state";
import { CopyButton } from "@/components/ui/copy-button";

export default function RadiiPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.radii.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Radii</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Border-radius tokens for rounded corners.
        </p>
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
      <h1 className="text-h1 text-[var(--text-primary)]">Radii</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Border-radius tokens for rounded corners.
      </p>
      <div className="mt-4 flex items-center gap-1.5">
        <Sparkles
          size={14}
          strokeWidth={1.5}
          className="text-[var(--text-tertiary)]"
        />
        <span
          className="text-[var(--text-tertiary)]"
          style={{ fontFamily: "var(--font-geist-sans)", fontSize: 12 }}
        >
          Auto-extracted from {source}
        </span>
      </div>

      {/* ── Section 1: Progression ── */}
      <div className="mt-10">
        <h2 className="text-h2 text-[var(--text-primary)] mb-6">
          Radius Progression
        </h2>
        <div className="flex flex-wrap gap-8 items-end">
          {sorted.map((radius) => (
            <div key={radius.name} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16"
                style={{
                  borderRadius: radius.value,
                  backgroundColor: "var(--accent-subtle)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <div
                className="text-[var(--text-secondary)] text-center"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
              >
                <div className="text-[var(--text-primary)] font-medium">
                  {radius.name}
                </div>
                <div>{radius.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Applied Examples matrix ── */}
      <div className="mt-14">
        <h2 className="text-h2 text-[var(--text-primary)] mb-6">
          Applied Examples
        </h2>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-[100px] h-[40px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-left">
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11,
                    }}
                  >
                    Component
                  </span>
                </th>
                {sorted.map((r) => (
                  <th
                    key={r.name}
                    className="w-[140px] h-[40px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 text-center"
                  >
                    <span
                      className="text-[var(--text-secondary)]"
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 11,
                      }}
                    >
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Button row */}
              <tr>
                <td className="border border-[var(--border-subtle)] px-3 py-2">
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: 12,
                    }}
                  >
                    Button
                  </span>
                </td>
                {sorted.map((r) => (
                  <td
                    key={r.name}
                    className="border border-[var(--border-subtle)] px-3 py-3 text-center"
                  >
                    <button
                      className="h-10 px-4 bg-[var(--accent)] text-white text-[13px] font-medium w-full"
                      style={{ borderRadius: r.value }}
                    >
                      Button
                    </button>
                  </td>
                ))}
              </tr>

              {/* Input row */}
              <tr>
                <td className="border border-[var(--border-subtle)] px-3 py-2">
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: 12,
                    }}
                  >
                    Input
                  </span>
                </td>
                {sorted.map((r) => (
                  <td
                    key={r.name}
                    className="border border-[var(--border-subtle)] px-3 py-3 text-center"
                  >
                    <input
                      className="h-10 w-full px-3 bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-[13px] text-[var(--text-secondary)] placeholder:text-[var(--text-placeholder)]"
                      style={{ borderRadius: r.value }}
                      placeholder="Input"
                      readOnly
                    />
                  </td>
                ))}
              </tr>

              {/* Card row */}
              <tr>
                <td className="border border-[var(--border-subtle)] px-3 py-2">
                  <span
                    className="text-[var(--text-tertiary)]"
                    style={{
                      fontFamily: "var(--font-geist-sans)",
                      fontSize: 12,
                    }}
                  >
                    Card
                  </span>
                </td>
                {sorted.map((r) => (
                  <td
                    key={r.name}
                    className="border border-[var(--border-subtle)] px-3 py-3 text-center"
                  >
                    <div
                      className="h-20 w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] flex items-center justify-center"
                      style={{ borderRadius: r.value }}
                    >
                      <span
                        className="text-[var(--text-tertiary)]"
                        style={{
                          fontFamily: "var(--font-geist-sans)",
                          fontSize: 12,
                        }}
                      >
                        Card
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Detail rows ── */}
      <div className="mt-14">
        <h2 className="text-h2 text-[var(--text-primary)] mb-4">
          Token Details
        </h2>
        {sorted.map((radius) => (
          <div
            key={radius.name}
            className="flex items-center gap-6 py-4 border-b border-[var(--border-subtle)]"
          >
            {/* Preview */}
            <div
              className="w-12 h-12 shrink-0 bg-[var(--accent-subtle)] border border-[var(--border-default)]"
              style={{ borderRadius: radius.value }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div
                className="text-[var(--text-primary)] font-medium"
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
              >
                {radius.name}
              </div>
              <div
                className="text-[var(--text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
              >
                {radius.tailwindClass}
              </div>
            </div>

            {/* Values */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div
                  className="text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                >
                  {radius.value}
                </div>
                <div
                  className="text-[var(--text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  {radius.px}px
                </div>
              </div>
              <CopyButton value={radius.value} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
