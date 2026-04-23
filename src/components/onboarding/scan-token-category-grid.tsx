"use client";

import * as React from "react";
import {
  Palette,
  Type,
  Ruler,
  Layers,
  CircleDot,
  Square,
  MousePointer2,
  Monitor,
  Droplet,
  BringToFront,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES: {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean; strokeWidth?: number }>;
}[] = [
  { id: "colors", label: "Colors", Icon: Palette },
  { id: "typography", label: "Typography", Icon: Type },
  { id: "spacing", label: "Spacing", Icon: Ruler },
  { id: "shadows", label: "Shadows", Icon: Layers },
  { id: "radii", label: "Radii", Icon: CircleDot },
  { id: "borders", label: "Borders", Icon: Square },
  { id: "animations", label: "Animations", Icon: MousePointer2 },
  { id: "breakpoints", label: "Breakpoints", Icon: Monitor },
  { id: "opacity", label: "Opacity", Icon: Droplet },
  { id: "zindex", label: "Z-Index", Icon: BringToFront },
  { id: "gradients", label: "Gradients", Icon: Sparkles },
  { id: "assets", label: "Assets", Icon: ImageIcon },
];

type CellState = "pending" | "active" | "complete";

function cellState(
  index: number,
  logLength: number,
  totalLogSteps: number,
): CellState {
  if (logLength >= totalLogSteps) return "complete";
  if (totalLogSteps <= 0) return index === 0 ? "active" : "pending";
  const wave = Math.min(11, Math.floor((logLength * 12) / totalLogSteps));
  if (index < wave) return "complete";
  if (index === wave) return "active";
  return "pending";
}

export function ScanTokenCategoryGrid({
  logLength,
  totalLogSteps,
  className,
}: {
  logLength: number;
  totalLogSteps: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--text-tertiary)] [font-family:var(--font-geist-mono)]">
        Design system tokens
      </p>
      <ul
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
        aria-label="Token categories being extracted"
      >
        {CATEGORIES.map((c, i) => {
          const state = cellState(i, logLength, totalLogSteps);
          const Icon = c.Icon;
          return (
            <li key={c.id} className="min-w-0 list-none">
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border px-1.5 py-2.5 [transition:background_0.25s_var(--ease-standard),border-color_0.25s_var(--ease-standard),color_0.25s_var(--ease-standard),opacity_0.25s_var(--ease-standard),transform_0.25s_var(--ease-standard)]",
                  state === "pending" && "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/60 text-[var(--text-tertiary)] opacity-[0.45]",
                  state === "active" &&
                    "border-[var(--purple-600)]/70 bg-[color-mix(in_srgb,var(--purple-600)_10%,var(--bg-elevated))] text-[var(--text-primary)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)] [transform:scale(1.02)]",
                  state === "complete" &&
                    "border-[var(--border-default)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--bg-elevated))] text-[var(--accent)] opacity-100",
                )}
                title={c.label}
              >
                {state === "active" ? <span className="autodsm-scan-sheen" aria-hidden /> : null}
                <Icon
                  className="relative z-[1] h-5 w-5 shrink-0 [stroke-width:1.5]"
                  aria-hidden
                />
                <span className="relative z-[1] mt-1 w-full truncate text-center text-[9px] font-medium leading-tight [font-family:var(--font-geist-sans)] sm:text-[10px]">
                  {c.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
