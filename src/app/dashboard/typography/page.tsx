"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const DEFAULT_SAMPLE = "the fox jumped over the lazy dog";

export default function TypographyPage() {
  const profile = useBrandStore((s) => s.profile);
  const [samples, setSamples] = React.useState<Record<string, string>>({});
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

  if (!profile) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Typography</h1>
        <div className="mt-10">
          <EmptyState
            title="No typography detected"
            description="We didn't find any typography tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  if (profile.fonts.length === 0 && profile.typography.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Typography</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Fonts, weights, and type scale extracted from your repository.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No typography detected"
            description="We didn't find any typography tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  const sortedTypography = [...profile.typography].sort(
    (a, b) => b.fontSizePx - a.fontSizePx
  );

  function startEdit(name: string) {
    setEditing(name);
    setDraft(samples[name] ?? DEFAULT_SAMPLE);
  }

  function commitEdit(name: string) {
    setSamples((prev) => ({
      ...prev,
      [name]: draft.trim() || DEFAULT_SAMPLE,
    }));
    setEditing(null);
  }

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <h1 className="text-h1 text-[var(--text-primary)]">Typography</h1>
      <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
        Fonts, weights, and type scale extracted from your repository.
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

      {/* ── Section 1: Font Cards ── */}
      {profile.fonts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-h2 text-[var(--text-primary)] mb-6">
            Font Families
          </h2>
          {profile.fonts.map((font) => (
            <div
              key={font.family}
              className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] p-6 mb-6"
            >
              {/* Family name in that font */}
              <div
                className="text-[var(--text-primary)] mb-2"
                style={{
                  fontFamily: `${font.family}, ${font.fallbacks.join(", ")}`,
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {font.family}
              </div>

              {/* Label row */}
              <div
                className="text-[var(--text-secondary)] mb-3"
                style={{ fontFamily: "var(--font-geist-sans)", fontSize: 13 }}
              >
                Imported via {font.importMethod} ·{" "}
                CSS var {font.variable ?? "—"} ·{" "}
                Display {font.displayStrategy ?? "swap"}
              </div>

              {/* Weight pills */}
              {font.weights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {font.weights.map((w) => (
                    <Badge
                      key={w.value}
                      variant="outline"
                      style={{
                        fontWeight: Number(w.value),
                        fontFamily: font.family,
                      }}
                    >
                      {w.value} · {w.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Charset preview */}
              <div
                className="text-[var(--text-secondary)] overflow-x-auto whitespace-nowrap pb-1"
                style={{
                  fontFamily: `${font.family}, ${font.fallbacks.join(", ")}`,
                  fontSize: 20,
                }}
              >
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz
                0123456789 !@#$%^&*
              </div>

              {/* Fallback stack */}
              <div
                className="text-[var(--text-tertiary)] mt-3"
                style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
              >
                Fallbacks: {font.fallbacks.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section 2: Type Ladder ── */}
      {sortedTypography.length > 0 && (
        <div className="mt-10">
          <h3
            className="text-h3 text-[var(--text-primary)] mb-6 sticky top-0 py-4 z-10"
            style={{ backgroundColor: "var(--bg-elevated)" }}
          >
            Type Ladder — all sizes at a glance
          </h3>

          {sortedTypography.map((type) => {
            const isEditing = editing === type.name;
            const sampleText = samples[type.name] ?? DEFAULT_SAMPLE;

            return (
              <div
                key={type.name}
                className="flex py-5 border-b border-[var(--border-subtle)] gap-6"
              >
                {/* Sample text */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(type.name);
                        if (e.key === "Escape") setEditing(null);
                      }}
                      onBlur={() => commitEdit(type.name)}
                      className="w-full bg-transparent outline-none border-b border-[var(--accent)] text-[var(--text-primary)] truncate"
                      style={{
                        fontSize: type.fontSize,
                        fontWeight: type.fontWeightNumeric,
                        fontFamily: type.fontFamily,
                        lineHeight: type.lineHeight,
                        letterSpacing: type.letterSpacing,
                      }}
                    />
                  ) : (
                    <p
                      className="truncate text-[var(--text-primary)] cursor-text"
                      title="Click to edit sample"
                      onClick={() => startEdit(type.name)}
                      style={{
                        fontSize: type.fontSize,
                        fontWeight: type.fontWeightNumeric,
                        fontFamily: type.fontFamily,
                        lineHeight: type.lineHeight,
                        letterSpacing: type.letterSpacing,
                      }}
                    >
                      {sampleText}
                    </p>
                  )}
                </div>

                {/* Spec block */}
                <div
                  className="w-full shrink-0 text-[var(--text-secondary)] space-y-0.5"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
                >
                  <div className="text-[var(--text-primary)] font-semibold">
                    {type.name}
                  </div>
                  <div>
                    Size {type.fontSizePx}px /{" "}
                    {type.lineHeightPx ?? "—"}px
                  </div>
                  <div>Weight {type.fontWeightNumeric}</div>
                  <div>
                    Tracking {type.letterSpacing ?? "normal"}
                  </div>
                  <div>Family {type.fontFamily}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
