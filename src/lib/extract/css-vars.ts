/**
 * css-vars.ts — PostCSS-based CSS custom property extractor.
 * Walks :root, .dark, [data-theme="..."], @theme (TW v4), and @keyframes.
 * PDF §10 — source 2: CSS custom properties.
 */

import postcss, { type Rule, type AtRule, type Declaration, type Root } from "postcss";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CssVarsResult {
  /** Variables from :root */
  lightVars: Record<string, string>;
  /** Variables from .dark or [data-theme="dark"] */
  darkVars: Record<string, string>;
  /** Variables from @theme (Tailwind v4) */
  themeVars: Record<string, string>;
  /** Keyframe blocks */
  keyframes: Array<{ name: string; css: string; source: string }>;
}

// ─── Selector matchers ────────────────────────────────────────────────────────

function isRootSelector(selector: string): boolean {
  return /(?:^|,)\s*:root\s*(?:,|$)/.test(selector) ||
    selector.trim() === ":root";
}

function isDarkSelector(selector: string): boolean {
  return (
    /(?:^|,)\s*\.dark\s*(?:,|$)/.test(selector) ||
    selector.trim() === ".dark" ||
    /\[data-theme=["']?dark["']?\]/.test(selector) ||
    /\.dark\s*$/.test(selector.trim())
  );
}

function isThemedSelector(selector: string): boolean {
  return /\[data-theme=/.test(selector);
}

// ─── Custom property extractor ────────────────────────────────────────────────

function extractCustomProps(
  rule: Rule,
  target: Record<string, string>
): void {
  rule.walkDecls(/^--/, (decl: Declaration) => {
    target[decl.prop] = decl.value.trim();
  });
}

// ─── Keyframe serialiser ──────────────────────────────────────────────────────

function serializeAtRule(node: AtRule): string {
  const inner = node.nodes
    ?.map((n) => n.toString())
    .join("\n  ") ?? "";
  return `@${node.name} ${node.params} {\n  ${inner}\n}`;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse CSS source and extract custom properties + keyframes.
 * Permissive — never throws; bad CSS is silently skipped.
 */
export function parseCssVars(
  source: string,
  filename: string
): CssVarsResult {
  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};
  const themeVars: Record<string, string> = {};
  const keyframes: CssVarsResult["keyframes"] = [];

  let root: Root;
  try {
    root = postcss.parse(source);
  } catch {
    return { lightVars, darkVars, themeVars, keyframes };
  }

  root.walk((node) => {
    // ── :root / .dark rules ──────────────────────────────────────────────────
    if (node.type === "rule") {
      const rule = node as Rule;
      const sel = rule.selector ?? "";

      if (isRootSelector(sel)) {
        extractCustomProps(rule, lightVars);
      } else if (isDarkSelector(sel)) {
        extractCustomProps(rule, darkVars);
      } else if (isThemedSelector(sel)) {
        // Other [data-theme=...] — extract into lightVars for now
        extractCustomProps(rule, lightVars);
      }
    }

    // ── @theme (Tailwind v4) / @keyframes ────────────────────────────────────
    if (node.type === "atrule") {
      const atRule = node as AtRule;

      if (atRule.name === "theme") {
        // Tailwind v4 @theme block — treat all decls as light vars
        atRule.walkDecls(/^--/, (decl: Declaration) => {
          themeVars[decl.prop] = decl.value.trim();
        });
      }

      if (atRule.name === "keyframes") {
        const name = atRule.params.trim();
        const css = serializeAtRule(atRule);
        keyframes.push({ name, css, source: filename });
      }
    }
  });

  return { lightVars, darkVars, themeVars, keyframes };
}
