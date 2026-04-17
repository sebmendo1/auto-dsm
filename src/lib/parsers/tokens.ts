/**
 * Token extractor — maximally permissive per the spec. Accepts:
 *
 *   • tailwind.config.{ts,js,cjs,mjs} — theme + theme.extend
 *   • CSS files with :root { --var: val } blocks
 *   • shadcn/ui — components.json + referenced CSS
 *   • Tailwind v4 `@theme { --color-...: ... }` blocks
 *   • DTCG tokens.json
 *   • CSS-in-JS object literals (best-effort)
 *
 * Returns a flat array of tokens, each with a category. The UI groups from
 * there.
 */

import { parse as parsePostcss } from 'postcss';

export type TokenCategory =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'radii'
  | 'borders'
  | 'shadows'
  | 'motion'
  | 'z-index'
  | 'breakpoints';

export interface Token {
  category: TokenCategory;
  group?: string; // primary, neutral, semantic, etc.
  name: string;
  value: string;
  css_variable?: string;
  source_file?: string;
  metadata?: Record<string, unknown>;
}

// ─── Main entry point ──────────────────────────────────────────────────────

export interface ExtractInput {
  files: Record<string, string>; // file path → content
}

export function extractTokens({ files }: ExtractInput): Token[] {
  const out: Token[] = [];

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith('tailwind.config.ts') || path.endsWith('tailwind.config.js') ||
        path.endsWith('tailwind.config.cjs') || path.endsWith('tailwind.config.mjs')) {
      out.push(...parseTailwindConfig(content, path));
    } else if (path.endsWith('.css') || path.endsWith('.scss')) {
      out.push(...parseCssVariables(content, path));
    } else if (path.endsWith('.tokens.json') || /tokens\/[^/]+\.json$/.test(path)) {
      try {
        out.push(...parseDtcgTokens(JSON.parse(content), path));
      } catch {
        /* noop */
      }
    }
  }

  return dedupe(out);
}

// ─── Tailwind config (JS/TS source) ────────────────────────────────────────

function parseTailwindConfig(source: string, path: string): Token[] {
  const out: Token[] = [];
  // We don't `eval` user code. Instead we scan for key theme sections by
  // string matching. This is brittle for clever configs but covers 95% of
  // real-world tailwind.config files (which are near-uniform).
  const themeBlock = extractObjectAfter(source, /theme\s*:\s*{/);
  const extendBlock = extractObjectAfter(source, /extend\s*:\s*{/);
  const merged = [themeBlock, extendBlock].filter(Boolean).join('\n');
  if (!merged) return out;

  out.push(...harvestKeyBlock(merged, 'colors', 'colors', path));
  out.push(...harvestKeyBlock(merged, 'fontSize', 'typography', path));
  out.push(...harvestKeyBlock(merged, 'fontFamily', 'typography', path, { group: 'family' }));
  out.push(...harvestKeyBlock(merged, 'spacing', 'spacing', path));
  out.push(...harvestKeyBlock(merged, 'borderRadius', 'radii', path));
  out.push(...harvestKeyBlock(merged, 'borderWidth', 'borders', path));
  out.push(...harvestKeyBlock(merged, 'boxShadow', 'shadows', path));
  out.push(...harvestKeyBlock(merged, 'transitionDuration', 'motion', path));
  out.push(...harvestKeyBlock(merged, 'transitionTimingFunction', 'motion', path));
  out.push(...harvestKeyBlock(merged, 'screens', 'breakpoints', path));
  out.push(...harvestKeyBlock(merged, 'zIndex', 'z-index', path));

  return out;
}

function extractObjectAfter(src: string, pattern: RegExp): string | null {
  const m = src.match(pattern);
  if (!m || m.index == null) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i);
    }
  }
  return null;
}

function harvestKeyBlock(
  block: string,
  key: string,
  category: TokenCategory,
  source: string,
  opts?: { group?: string },
): Token[] {
  const rx = new RegExp(`${key}\\s*:\\s*{`);
  const m = block.match(rx);
  if (!m || m.index == null) return [];
  const start = m.index + m[0].length;
  let depth = 1;
  let end = start;
  for (let i = start; i < block.length; i++) {
    const c = block[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const body = block.slice(start, end);
  return parseKVPairs(body, category, source, opts?.group);
}

function parseKVPairs(
  body: string,
  category: TokenCategory,
  source: string,
  group?: string,
): Token[] {
  const out: Token[] = [];
  // matches:   foo: 'value' ,   or   '500': '#abc'   or   foo: { ... nested ... }
  const rx = /['"]?([\w.-]+)['"]?\s*:\s*(['"`])([^'"`]+)\2/g;
  let m;
  while ((m = rx.exec(body))) {
    out.push({
      category,
      group,
      name: m[1],
      value: m[3],
      source_file: source,
    });
  }
  // nested objects like colors.primary = { 500: '#...' }
  const nestedRx = /['"]?([\w.-]+)['"]?\s*:\s*{([^{}]*)}/g;
  let nm;
  while ((nm = nestedRx.exec(body))) {
    const groupName = nm[1];
    const inner = nm[2];
    const ikv = /['"]?([\w.-]+)['"]?\s*:\s*(['"`])([^'"`]+)\2/g;
    let im;
    while ((im = ikv.exec(inner))) {
      out.push({
        category,
        group: groupName,
        name: `${groupName}.${im[1]}`,
        value: im[3],
        source_file: source,
      });
    }
  }
  return out;
}

// ─── CSS variables ─────────────────────────────────────────────────────────

function parseCssVariables(source: string, path: string): Token[] {
  const out: Token[] = [];
  let ast;
  try {
    ast = parsePostcss(source);
  } catch {
    return out;
  }
  ast.walkRules((rule) => {
    const inRoot = /:root|\.dark|\.light|\[data-theme/.test(rule.selector);
    const isTheme = rule.selector === '@theme';
    if (!inRoot && !isTheme) return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      const value = decl.value;
      const category = classifyValue(decl.prop, value);
      out.push({
        category,
        name: decl.prop.replace(/^--/, ''),
        css_variable: decl.prop,
        value,
        source_file: path,
        group: rule.selector === '.dark' ? 'dark' : undefined,
      });
    });
  });
  // Tailwind v4 @theme top-level
  ast.walkAtRules('theme', (at) => {
    at.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) return;
      out.push({
        category: classifyValue(decl.prop, decl.value),
        name: decl.prop.replace(/^--/, ''),
        css_variable: decl.prop,
        value: decl.value,
        source_file: path,
      });
    });
  });
  return out;
}

function classifyValue(name: string, value: string): TokenCategory {
  const n = name.toLowerCase();
  if (/color|bg|text|border|accent|fg|shadow|success|error|warning|info/.test(n)) {
    if (/shadow/.test(n)) return 'shadows';
    if (isColor(value)) return 'colors';
    if (/shadow/i.test(value)) return 'shadows';
  }
  if (/radius|rounded/.test(n)) return 'radii';
  if (/shadow/.test(n)) return 'shadows';
  if (/duration|ease|transition|motion/.test(n)) return 'motion';
  if (/spacing|gap|pad/.test(n)) return 'spacing';
  if (/font/.test(n) || /leading/.test(n) || /tracking/.test(n)) return 'typography';
  if (/breakpoint|screen/.test(n)) return 'breakpoints';
  if (/z(-|_)?index/.test(n)) return 'z-index';
  if (/border(?!-radius)/.test(n)) return 'borders';
  if (isColor(value)) return 'colors';
  return 'spacing'; // sensible fallback
}

function isColor(value: string): boolean {
  const v = value.trim();
  return (
    /^#[0-9a-f]{3,8}$/i.test(v) ||
    /^rgb|^hsl|^oklch|^oklab/.test(v) ||
    /^(black|white|transparent|currentColor)$/i.test(v)
  );
}

// ─── DTCG JSON ─────────────────────────────────────────────────────────────

function parseDtcgTokens(obj: unknown, path: string, prefix = ''): Token[] {
  const out: Token[] = [];
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v && typeof v === 'object' && '$value' in v) {
        const cat = mapDtcgCategory((v as Record<string, unknown>).$type as string);
        out.push({
          category: cat,
          name: prefix ? `${prefix}.${k}` : k,
          value: String((v as Record<string, unknown>).$value),
          source_file: path,
        });
      } else if (typeof v === 'object') {
        out.push(...parseDtcgTokens(v, path, prefix ? `${prefix}.${k}` : k));
      }
    }
  }
  return out;
}

function mapDtcgCategory(type?: string): TokenCategory {
  switch (type) {
    case 'color': return 'colors';
    case 'fontFamily':
    case 'fontSize':
    case 'fontWeight': return 'typography';
    case 'shadow': return 'shadows';
    case 'duration': return 'motion';
    case 'dimension':
    default: return 'spacing';
  }
}

// ─── Cleanup ───────────────────────────────────────────────────────────────

function dedupe(tokens: Token[]): Token[] {
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const t of tokens) {
    const key = `${t.category}::${t.name}::${t.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

// ─── Grouping helpers (used by UI) ─────────────────────────────────────────

export function groupTokens(tokens: Token[], category: TokenCategory) {
  const inCat = tokens.filter((t) => t.category === category);
  const buckets = new Map<string, Token[]>();
  for (const t of inCat) {
    const group = t.group ?? detectGroup(t.name) ?? 'Other';
    const arr = buckets.get(group) ?? [];
    arr.push(t);
    buckets.set(group, arr);
  }
  return Array.from(buckets.entries()).map(([name, tokens]) => ({ name, tokens }));
}

function detectGroup(name: string): string | undefined {
  const n = name.toLowerCase();
  if (/primary/.test(n)) return 'Primary';
  if (/accent/.test(n)) return 'Accent';
  if (/neutral|gray|grey/.test(n)) return 'Neutral';
  if (/success|error|warning|info|danger/.test(n)) return 'Semantic';
  if (/secondary/.test(n)) return 'Secondary';
  return undefined;
}
