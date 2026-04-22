/**
 * Perplexity-style brand / preview cards: map design reference hexes to autoDSM tokens.
 *
 * | Ref / role        | Default token / class                    |
 * |------------------|------------------------------------------|
 * | Shell #F3F3F4    | bg-[var(--bg-canvas)] (light)           |
 * | Text #111        | text-[var(--text-primary)]             |
 * | White surfaces   | bg-[var(--bg-elevated)] or bg-white   |
 * | Muted label rows | text-[var(--text-secondary)] + opacity |
 *
 * Not tokenized (always pass props): swatch/brand color, dark palette #4C4C4C, copy payload.
 */
export const brandCardShell = "bg-[var(--bg-canvas)] text-[var(--text-primary)]";
export const brandCardPaper = "bg-[var(--bg-elevated)]";
/**
 * Shared border radius for dashboard overview cards (Logos, Typography, Colors)
 * and matching brand preview components (`ColorCard`, inner asset preview, etc.).
 */
export const brandDashboardCardRadius = "rounded-2xl";
/**
 * Inset “token” card on the elevated work area — matches Color rows + Typography preview cards
 * (canvas background, 2xl radius, primary text). Prefer this over ad-hoc `rounded-xl` + `bg-elevated`.
 */
export const brandTokenSurface = `${brandDashboardCardRadius} ${brandCardShell}`;
/** When a light hairline helps separation (e.g. dense `bg-tertiary` parents). */
export const brandTokenSurfaceBordered = `${brandTokenSurface} border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]`;
/** Default dark inner surface (Color-Palette ref). Override via `surfaceClassName`. */
export const defaultPaletteSurface = "bg-[#4C4C4C]";
/**
 * Approx. SVG feOffset dy=8 + feGaussianBlur stdDeviation=8 + 4% black (Color-Palette ref).
 * Override via `shadowClassName` on `ColorPaletteCard`.
 */
export const defaultPaletteDropShadow = "shadow-[0_8px_16px_rgba(17,17,17,0.04)]";
