/**
 * src/lib/extract/index.ts — Public API for the AutoDSM extraction engine.
 *
 * Import from here rather than individual files:
 *   import { buildBrandProfile, parseTailwindConfig, parseCssVars, ... } from "@/lib/extract"
 */

// ── Orchestrator ──────────────────────────────────────────────────────────────
export { buildBrandProfile } from "./build-profile";
export type { BuildProfileInput } from "./build-profile";

// ── Color utilities ───────────────────────────────────────────────────────────
export {
  toHex,
  toHsl,
  toRgbString,
  toOklchString,
  contrastRatio,
  classifyGroup,
} from "./color-utils";

// ── Tailwind config parser ─────────────────────────────────────────────────────
export {
  parseTailwindConfig,
  TAILWIND_DEFAULTS,
} from "./tailwind-config";
export type { ParsedTailwindTheme, ThemeValueMap } from "./tailwind-config";

// ── CSS variable parser ────────────────────────────────────────────────────────
export { parseCssVars } from "./css-vars";
export type { CssVarsResult } from "./css-vars";

// ── shadcn config resolver ─────────────────────────────────────────────────────
export { parseShadcnConfig } from "./shadcn-config";
export type { ShadcnConfigResult } from "./shadcn-config";

// ── Font detection ────────────────────────────────────────────────────────────
export { detectFonts } from "./fonts";
export type { FontFileInput } from "./fonts";

// ── Asset scanner ─────────────────────────────────────────────────────────────
export { scanAssets } from "./assets";
export type { AssetFile } from "./assets";
