"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";

export default function BordersPage() {
  const profile = useBrandStore((s) => s.profile);

  if (!profile || profile.borders.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Borders</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Border widths, styles, and colors used in your UI.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No borders detected"
            description="We didn't find any border tokens in this repo's source files."
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
      <h1 className="text-h1 text-[var(--text-primary)]">Borders</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Border widths, styles, and colors used in your UI.
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

      <div className="mt-10 space-y-0">
        {profile.borders.map((border, i) => {
          const borderCss = `${border.width} ${border.style} ${border.color}`;
          return (
            <div
              key={`${border.name}-${i}`}
              className="flex items-center gap-8 py-5 border-b border-[var(--border-subtle)]"
            >
              {/* Preview card */}
              <div
                className="w-24 h-16 rounded-xl bg-[var(--bg-elevated)] shrink-0 flex items-center justify-center"
                style={{
                  border: `${border.width} ${border.style} ${border.color}`,
                }}
              />

              {/* Middle: name */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[var(--text-primary)] font-medium"
                  style={{ fontFamily: "var(--font-geist-sans)", fontSize: 14 }}
                >
                  {border.name}
                </div>
                <div
                  className="text-[var(--text-tertiary)] mt-0.5"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  {border.source}
                </div>
              </div>

              {/* Right: spec */}
              <div className="w-[300px] shrink-0">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <div
                      className="text-[var(--text-tertiary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
                    >
                      WIDTH
                    </div>
                    <div
                      className="text-[var(--text-primary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                    >
                      {border.width}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[var(--text-tertiary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
                    >
                      STYLE
                    </div>
                    <div
                      className="text-[var(--text-primary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                    >
                      {border.style}
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[var(--text-tertiary)]"
                      style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
                    >
                      COLOR
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-sm border border-[var(--border-default)]"
                        style={{ backgroundColor: border.color }}
                      />
                      <span
                        className="text-[var(--text-primary)]"
                        style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
                      >
                        {border.color}
                      </span>
                    </div>
                    {border.colorToken && (
                      <div
                        className="text-[var(--text-tertiary)]"
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 11,
                        }}
                      >
                        {border.colorToken}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3">
                  <span
                    className="text-[var(--text-tertiary)] break-all flex-1"
                    style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                  >
                    {borderCss}
                  </span>
                  <CopyButton value={borderCss} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
