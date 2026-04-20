"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ShadowsPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.shadows.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Shadows</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Elevation tokens for cards, modals, and focus rings.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No shadows detected"
            description="We didn't find any shadow tokens in this repo's source files."
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
      <h1 className="text-h1 text-[var(--text-primary)]">Shadows</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Elevation tokens for cards, modals, and focus rings.
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

      {/* ── Section 1: Side-by-side progression ── */}
      <div className="mt-10">
        <h2 className="text-h2 text-[var(--text-primary)] mb-6">
          Elevation Progression
        </h2>
        {profile.shadows.map((shadow) => (
          <div key={shadow.name} className="mb-10">
            <div
              className="text-[var(--text-primary)] mb-4"
              style={{
                fontFamily: "var(--font-geist-sans)",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {shadow.name}
            </div>
            <div className="flex gap-6">
              {/* Light surface */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-[160px] h-[96px] bg-[#f9f9fa] rounded-xl flex items-center justify-center"
                  style={{ boxShadow: shadow.value }}
                >
                  <div
                    className="w-16 h-16 bg-[var(--bg-elevated)] rounded-xl"
                    style={{ boxShadow: shadow.value }}
                  />
                </div>
                <span
                  className="text-[var(--text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                >
                  Light surface
                </span>
              </div>

              {/* Dark surface */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-[160px] h-[96px] rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#0A0A0B", boxShadow: "none" }}
                >
                  <div
                    className="w-16 h-16 bg-[var(--bg-elevated)] rounded-xl"
                    style={{ boxShadow: shadow.value }}
                  />
                </div>
                <span
                  className="text-[var(--text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}
                >
                  Dark surface
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2: Detail rows ── */}
      <div className="mt-8">
        <h2 className="text-h2 text-[var(--text-primary)] mb-6">
          Token Details
        </h2>
        {profile.shadows.map((shadow) => (
          <div
            key={shadow.name}
            className="flex items-start py-5 border-b border-[var(--border-subtle)] gap-6"
          >
            {/* Preview card */}
            <div
              className="w-24 h-24 bg-[var(--bg-elevated)] rounded-xl shrink-0"
              style={{ boxShadow: shadow.value }}
            />

            {/* Middle */}
            <div className="flex-1 pl-2 min-w-0">
              <div
                className="text-[var(--text-primary)] font-medium mb-0.5"
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
              >
                {shadow.name}
              </div>
              <div
                className="text-[var(--text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
              >
                {shadow.tailwindClass}
              </div>

              {/* Collapsible layers */}
              {shadow.layers.length > 0 && (
                <details className="mt-3">
                  <summary
                    className="cursor-pointer text-[var(--text-tertiary)] select-none"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                  >
                    Layers ({shadow.layers.length})
                  </summary>
                  <div className="mt-2 overflow-x-auto">
                    <table className="text-[11px] border-collapse w-full">
                      <thead>
                        <tr>
                          {[
                            "offsetX",
                            "offsetY",
                            "blur",
                            "spread",
                            "color",
                            "inset",
                          ].map((col) => (
                            <th
                              key={col}
                              className="text-left px-2 py-1 border border-[var(--border-subtle)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                              style={{ fontFamily: "var(--font-geist-mono)" }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shadow.layers.map((layer, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{layer.offsetX}</td>
                            <td className="px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{layer.offsetY}</td>
                            <td className="px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{layer.blur}</td>
                            <td className="px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist-mono)" }}>{layer.spread}</td>
                            <td className="px-2 py-1 border border-[var(--border-subtle)]">
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-3 h-3 rounded-sm border border-[var(--border-default)]"
                                  style={{ backgroundColor: layer.colorHex }}
                                />
                                <span
                                  className="text-[var(--text-secondary)]"
                                  style={{ fontFamily: "var(--font-geist-mono)" }}
                                >
                                  {layer.colorHex}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                              {layer.inset ? "yes" : "no"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>

            {/* Right: CSS value + copy */}
            <div className="w-[280px] shrink-0">
              <div className="flex items-start gap-1">
                <span
                  className="text-[var(--text-secondary)] break-all flex-1"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  {shadow.value}
                </span>
                <CopyButton value={shadow.value} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
