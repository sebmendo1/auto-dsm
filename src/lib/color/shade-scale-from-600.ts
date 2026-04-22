import { formatHex, parse, converter } from "culori";

const toOklch = converter("oklch");

function mixOklch(
  a: { l: number; c: number; h: number },
  b: { l: number; c: number; h: number },
  t: number,
) {
  return {
    mode: "oklch" as const,
    l: a.l + t * (b.l - a.l),
    c: a.c + t * (b.c - a.c),
    h: a.h + t * (b.h - a.h),
  };
}

/** Tailwind-style weights, left (darkest) → right (lightest). */
export const SHADE_WEIGHTS_LTR = [900, 800, 700, 600, 500, 400, 300, 200, 100, 50] as const;
export type ShadeWeight = (typeof SHADE_WEIGHTS_LTR)[number];

export type ShadeSwatch = { weight: ShadeWeight; hex: string };

const FALLBACK: ShadeSwatch[] = SHADE_WEIGHTS_LTR.map((weight, i) => ({
  weight,
  hex: ["#3b0764", "#5b21b6", "#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"][
    i
  ]!,
}));

/**
 * Builds a 10-step palette (900 → 50, left → right) in OKLch, treating `baseHex` as the **600** stop.
 * If only one color is supplied, use it as 600 and derive 50–900.
 */
export function shadeScaleFrom600(baseHex: string): ShadeSwatch[] {
  const normalized = normalizeHexInput(baseHex);
  const parsed = parse(normalized);
  if (!parsed) return FALLBACK;

  const mid = toOklch(parsed);
  if (!mid || mid.l == null) return FALLBACK;

  const h = typeof mid.h === "number" && Number.isFinite(mid.h) ? mid.h : 0;
  const l600 = mid.l;
  const c600 = mid.c ?? 0;

  const dark = {
    mode: "oklch" as const,
    l: Math.max(0.1, Math.min(l600 * 0.4, 0.26)),
    c: Math.min(Math.max(c600 * 1.06, 0.02) + 0.02, 0.34),
    h,
  };
  const light = {
    mode: "oklch" as const,
    l: 0.98,
    c: Math.max(0.012, c600 * 0.11),
    h,
  };

  try {
    const m = { l: l600, c: c600, h };
    const d = { l: dark.l, c: dark.c, h };
    const ell = { l: light.l, c: light.c, h: light.h };
    const hexes: string[] = [];
    for (let i = 0; i < 4; i++) {
      hexes.push(formatHex(mixOklch(d, m, i / 3)));
    }
    for (let j = 1; j <= 6; j++) {
      hexes.push(formatHex(mixOklch(m, ell, j / 6)));
    }
    return SHADE_WEIGHTS_LTR.map((weight, i) => ({
      weight,
      hex: normalizeHexOutput(hexes[i]!),
    }));
  } catch {
    return FALLBACK;
  }
}

/** Use when callers already have 10 hex values in 900→50 order. */
export function shadeSwatchesFromHexes(hexes: readonly string[]): ShadeSwatch[] | null {
  if (hexes.length !== 10) return null;
  return SHADE_WEIGHTS_LTR.map((weight, i) => ({
    weight,
    hex: normalizeHexOutput(hexes[i]!),
  }));
}

function normalizeHexInput(input: string): string {
  const t = input.trim();
  if (!t) return "#7c3aed";
  if (t.startsWith("#")) return t;
  return `#${t}`;
}

function normalizeHexOutput(hex: string): string {
  const p = parse(hex);
  if (!p) return "#7c3aed";
  const h = formatHex(p);
  return h.startsWith("#") ? h : `#${h}`;
}
