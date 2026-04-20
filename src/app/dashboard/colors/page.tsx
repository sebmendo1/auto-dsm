"use client";

import * as React from "react";
import { Sparkles, Check, X } from "lucide-react";
import { useBrandStore } from "@/stores/brand";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { BrandColor, ColorGroup } from "@/lib/brand/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function hexLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length < 6) return 0;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WHITE_LUM = 1;
const BLACK_LUM = 0;

const GROUP_ORDER: ColorGroup[] = [
  "brand",
  "accent",
  "semantic",
  "surface",
  "neutral",
  "interactive",
  "chart",
  "custom",
];

const GROUP_LABELS: Record<ColorGroup, string> = {
  brand: "Brand Colors",
  accent: "Accent Colors",
  semantic: "Semantic Colors",
  surface: "Surface Colors",
  neutral: "Text & Neutral Colors",
  interactive: "Border & Interactive",
  chart: "Chart Colors",
  custom: "Custom Colors",
};

// ── contrast badge ────────────────────────────────────────────────────────────

function ContrastBadge({
  ratio,
  level,
  against,
}: {
  ratio: number;
  level: "AA" | "AAA";
  against: "white" | "black";
}) {
  const threshold = level === "AA" ? 4.5 : 7;
  const pass = ratio >= threshold;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium leading-none",
          pass
            ? "text-[rgb(34_197_94)]"
            : "text-[rgb(239_68_68)] line-through"
        )}
        style={{
          backgroundColor: pass
            ? "rgb(34 197 94 / 0.15)"
            : "rgb(239 68 68 / 0.12)",
        }}
      >
        {pass ? (
          <Check size={9} strokeWidth={2} />
        ) : (
          <X size={9} strokeWidth={2} />
        )}
        {level}
      </span>
      <span
        style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10 }}
        className="text-[var(--text-tertiary)]"
      >
        vs {against}
      </span>
    </div>
  );
}

// ── color row ────────────────────────────────────────────────────────────────

function ColorRow({
  color,
  darkMode,
}: {
  color: BrandColor;
  darkMode: boolean;
}) {
  const displayHex = darkMode
    ? color.darkModeValue ?? color.value
    : color.value;
  const lum = hexLuminance(displayHex);
  const ratioVsWhite = contrastRatio(lum, WHITE_LUM);
  const ratioVsBlack = contrastRatio(lum, BLACK_LUM);

  return (
    <div className="flex gap-6 items-center border-b border-[var(--border-subtle)] py-4">
      {/* Swatch */}
      <div
        className="w-[72px] h-[72px] rounded-2xl border border-[var(--border-default)] shrink-0"
        style={{ backgroundColor: displayHex }}
      />

      {/* Middle */}
      <div className="flex-1 min-w-0">
        <div
          className="text-[var(--text-primary)] font-semibold"
          style={{ fontFamily: "var(--font-geist-sans)", fontSize: 16 }}
        >
          {color.name}
        </div>
        <div
          className="text-[var(--text-tertiary)] mt-0.5"
          style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
        >
          {color.cssVariable}
        </div>
        {color.darkModeHex && color.darkModeHex !== color.value && (
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-0.5">
              <span
                className="inline-block w-3 h-3 rounded-full border border-[var(--border-default)]"
                style={{ backgroundColor: color.darkModeHex }}
              />
              <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11 }}>
                DARK {color.darkModeHex}
              </span>
            </Badge>
          </div>
        )}
      </div>

      {/* Right */}
      <div className="w-[240px] shrink-0">
        <div className="text-right space-y-0.5">
          <div className="flex items-center justify-end gap-1">
            <span
              className="text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 13 }}
            >
              {displayHex}
            </span>
            <CopyButton value={displayHex} />
          </div>
          <div className="flex items-center justify-end gap-1">
            <span
              className="text-[var(--text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
            >
              {color.rgb}
            </span>
            <CopyButton value={color.rgb} />
          </div>
          <div className="flex items-center justify-end gap-1">
            <span
              className="text-[var(--text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}
            >
              {color.hsl}
            </span>
            <CopyButton value={color.hsl} />
          </div>
        </div>

        {/* Contrast badges */}
        <div className="flex justify-end gap-3 mt-2">
          <ContrastBadge
            ratio={ratioVsWhite}
            level="AA"
            against="white"
          />
          <ContrastBadge
            ratio={ratioVsBlack}
            level="AA"
            against="black"
          />
          <ContrastBadge
            ratio={ratioVsWhite}
            level="AAA"
            against="white"
          />
          <ContrastBadge
            ratio={ratioVsBlack}
            level="AAA"
            against="black"
          />
        </div>
      </div>
    </div>
  );
}

// ── contrast matrix ───────────────────────────────────────────────────────────

function ContrastMatrix({ colors }: { colors: BrandColor[] }) {
  const bgColors = colors
    .filter(
      (c) => c.group === "neutral" || c.group === "surface"
    )
    .slice(0, 10);

  const fgColors = colors
    .filter(
      (c) =>
        c.group === "brand" ||
        c.group === "accent" ||
        c.name.includes("foreground") ||
        c.name.includes("primary") ||
        c.group === "neutral"
    )
    .slice(0, 10);

  if (bgColors.length === 0 || fgColors.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-h2 text-[var(--text-primary)]">
        Color Contrast Matrix
      </h2>
      <p className="mt-2 text-body-s text-[var(--text-secondary)]">
        Ratios calculated per WCAG 2.1. Green cells pass AA for normal text (≥4.5:1).
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="w-[120px] h-[64px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)]" />
              {bgColors.map((bg) => (
                <th
                  key={bg.cssVariable}
                  className="w-[100px] h-[64px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2"
                >
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-6 h-6 rounded border border-[var(--border-default)]"
                      style={{ backgroundColor: bg.value }}
                    />
                    <span
                      className="text-[var(--text-tertiary)] text-[10px] leading-tight text-center"
                      style={{ fontFamily: "var(--font-geist-mono)" }}
                    >
                      {bg.name.length > 10
                        ? bg.name.slice(0, 10) + "…"
                        : bg.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fgColors.map((fg) => {
              const fgLum = hexLuminance(fg.value);
              return (
                <tr key={fg.cssVariable}>
                  <td className="border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded border border-[var(--border-default)] shrink-0"
                        style={{ backgroundColor: fg.value }}
                      />
                      <span
                        className="text-[var(--text-tertiary)] text-[10px]"
                        style={{ fontFamily: "var(--font-geist-mono)" }}
                      >
                        {fg.name.length > 12
                          ? fg.name.slice(0, 12) + "…"
                          : fg.name}
                      </span>
                    </div>
                  </td>
                  {bgColors.map((bg) => {
                    const bgLum = hexLuminance(bg.value);
                    const ratio = contrastRatio(fgLum, bgLum);
                    const pass = ratio >= 4.5;
                    return (
                      <td
                        key={bg.cssVariable}
                        className="border border-[var(--border-subtle)] p-2 text-center"
                        style={{
                          backgroundColor: pass
                            ? "rgb(34 197 94 / 0.12)"
                            : "rgb(239 68 68 / 0.08)",
                        }}
                      >
                        <div
                          className="font-medium"
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 12,
                            color: pass ? "rgb(34 197 94)" : "rgb(239 68 68)",
                          }}
                        >
                          {ratio.toFixed(1)}
                        </div>
                        <div
                          className="text-[10px] mt-0.5"
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            color: pass ? "rgb(34 197 94)" : "rgb(239 68 68)",
                          }}
                        >
                          {pass ? "AA" : "FAIL"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ColorsPage() {
  const profile = useBrandStore((s) => s.profile);
  const [darkMode, setDarkMode] = React.useState(false);

  if (!profile || profile.colors.length === 0) {
    return (
      <div className="px-10 py-10 max-w-[1200px]">
        <h1 className="text-h1 text-[var(--text-primary)]">Colors</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
          Every color token extracted from your theme, grouped by role, with WCAG contrast scores.
        </p>
        <div className="mt-10">
          <EmptyState
            title="No colors detected"
            description="We didn't find any color tokens in this repo's source files."
          />
        </div>
      </div>
    );
  }

  const grouped = GROUP_ORDER.reduce<Record<ColorGroup, BrandColor[]>>(
    (acc, g) => {
      acc[g] = profile.colors.filter((c) => c.group === g);
      return acc;
    },
    {
      brand: [],
      accent: [],
      semantic: [],
      surface: [],
      neutral: [],
      interactive: [],
      chart: [],
      custom: [],
    }
  );

  const source =
    profile.meta.cssSource ||
    profile.meta.tailwindConfigPath ||
    "repo";

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-[var(--text-primary)]">Colors</h1>
          <p className="mt-2 text-body-s text-[var(--text-secondary)] max-w-[640px]">
            Every color token extracted from your theme, grouped by role, with
            WCAG contrast scores.
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
        </div>

        {/* Light/Dark toggle */}
        <div className="flex items-center rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] p-0.5 gap-0.5">
          {(["Light", "Dark"] as const).map((mode) => {
            const active = mode === "Dark" ? darkMode : !darkMode;
            return (
              <button
                key={mode}
                onClick={() => setDarkMode(mode === "Dark")}
                className={cn(
                  "px-3 py-1 rounded-full text-[12px] font-medium transition-all duration-150",
                  active
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                )}
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color groups */}
      <div className="mt-10">
        {GROUP_ORDER.map((group) => {
          const items = grouped[group];
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-12">
              <h2 className="text-h2 text-[var(--text-primary)] mb-2">
                {GROUP_LABELS[group]}
                <span
                  className="ml-2 text-[var(--text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono)", fontSize: 14 }}
                >
                  {items.length}
                </span>
              </h2>
              {items.map((color) => (
                <ColorRow
                  key={color.cssVariable}
                  color={color}
                  darkMode={darkMode}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Contrast matrix */}
      <ContrastMatrix colors={profile.colors} />
    </div>
  );
}
