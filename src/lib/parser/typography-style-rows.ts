import type { FontInfo } from "@/lib/github/types";
import type { TypographyStyleRow, TypographyToken } from "./types";

const SIZE_VALUE_RE = /^(\d+(?:\.\d+)?)(px|rem|em|%)$/;

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return `r${(h >>> 0).toString(36)}`;
}

export function makeRowId(
  sourcePath: string,
  displayName: string,
  fontSize?: string,
  fontFamilyCss?: string,
): string {
  return hashString(`${sourcePath}::${displayName}::${fontSize ?? ""}::${fontFamilyCss ?? ""}`);
}

/** First family name for display (strips quotes / generic fallbacks when possible). */
export function firstFamilyDisplayName(fontFamilyCss: string): string {
  const part = fontFamilyCss.split(",")[0]?.trim() ?? fontFamilyCss;
  const quoted = part.match(/^["']([^"']+)["']/);
  if (quoted) return quoted[1].trim();
  const word = part.replace(/['"]/g, "").trim();
  if (!word || /^inherit|initial|unset|var\(/i.test(word)) return "System";
  return word.slice(0, 48);
}

function humanizeSelector(selector: string): string {
  const first = selector.split(",")[0]?.trim() ?? selector;
  if (first.startsWith(".")) {
    return first
      .slice(1)
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (first.startsWith("#")) {
    return first
      .slice(1)
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return first
    .replace(/[:.#>+~[\]="'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Merge longhand typography from plain CSS rule blocks into one row per block
 * when at least font-size or font-family is present.
 */
export function cssContentToTypographyRows(content: string, sourcePath: string): TypographyStyleRow[] {
  const rows: TypographyStyleRow[] = [];
  const blockRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    const body = match[2];
    if (selector.startsWith("@")) continue;
    if (selector.includes("@media") || selector.includes("@supports")) continue;

    const fontSizeMatch = body.match(/font-size\s*:\s*([^;]+);/i);
    const lineHeightMatch = body.match(/line-height\s*:\s*([^;]+);/i);
    const letterSpacingMatch = body.match(/letter-spacing\s*:\s*([^;]+);/i);
    const fontWeightMatch = body.match(/font-weight\s*:\s*([^;]+);/i);
    const fontFamilyMatch = body.match(/font-family\s*:\s*([^;]+);/i);

    const fontSize = fontSizeMatch?.[1].trim();
    const lineHeight = lineHeightMatch?.[1].trim();
    const letterSpacing = letterSpacingMatch?.[1].trim();
    const fontWeight = fontWeightMatch?.[1].trim();
    const fontFamilyCss = fontFamilyMatch?.[1].trim();

    if (!fontSize && !fontFamilyCss) continue;

    const displayName = humanizeSelector(selector) || "Style";
    const ffCss = fontFamilyCss ?? "inherit";
    const ffDisplay = fontFamilyCss ? firstFamilyDisplayName(fontFamilyCss) : "inherit";

    rows.push({
      id: makeRowId(sourcePath, displayName, fontSize, ffCss),
      displayName,
      fontFamily: ffDisplay,
      fontFamilyCss: ffCss,
      fontSize: fontSize || undefined,
      lineHeight: lineHeight || undefined,
      letterSpacing: letterSpacing || undefined,
      fontWeight: fontWeight || undefined,
      sourcePath,
    });
  }

  return rows;
}

function defaultFamilyFromFonts(fonts: FontInfo[]): { display: string; css: string } {
  if (fonts.length === 0) {
    return { display: "Geist", css: "var(--font-geist-sans), system-ui, sans-serif" };
  }
  const name = fonts[0].name;
  return { display: name, css: `"${name}", var(--font-geist-sans), system-ui, sans-serif` };
}

/**
 * Build rows from flat typography tokens (sizes + loose font-* entries) when
 * they are not already represented by merged CSS/Tailwind rows.
 */
export function typographyTokensToRows(
  tokens: TypographyToken[],
  fonts: FontInfo[],
  sourcePath: string,
): TypographyStyleRow[] {
  const { display: defDisplay, css: defCss } = defaultFamilyFromFonts(fonts);
  const rows: TypographyStyleRow[] = [];

  for (const t of tokens) {
    if (SIZE_VALUE_RE.test(t.value.trim())) {
      rows.push({
        id: makeRowId(sourcePath, t.name, t.value, defCss),
        displayName: t.name,
        fontFamily: defDisplay,
        fontFamilyCss: defCss,
        fontSize: t.value.trim(),
        lineHeight: t.lineHeight,
        sourcePath,
      });
      continue;
    }
    if (t.name.startsWith("font-") && /,|['"]/.test(t.value)) {
      const css = t.value.trim();
      rows.push({
        id: makeRowId(sourcePath, t.name, undefined, css),
        displayName: t.name.replace(/^font-/i, "").replace(/-/g, " ") || t.name,
        fontFamily: firstFamilyDisplayName(css),
        fontFamilyCss: css,
        sourcePath,
      });
    }
  }

  return rows;
}

export function dedupeTypographyRows(rows: TypographyStyleRow[]): TypographyStyleRow[] {
  const seen = new Map<string, TypographyStyleRow>();
  for (const row of rows) {
    const key = `${row.sourcePath.toLowerCase()}|${row.displayName.toLowerCase()}|${(row.fontSize ?? "").toLowerCase()}|${row.fontFamilyCss.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row);
      continue;
    }
    seen.set(key, mergeRowPreferFilled(existing, row));
  }
  return Array.from(seen.values());
}

function mergeRowPreferFilled(a: TypographyStyleRow, b: TypographyStyleRow): TypographyStyleRow {
  const score = (r: TypographyStyleRow) =>
    [r.fontSize, r.lineHeight, r.letterSpacing, r.fontWeight, r.fontFamilyCss !== "inherit" ? 1 : 0].filter(
      Boolean,
    ).length;
  return score(b) > score(a) ? { ...a, ...b, id: a.id } : { ...b, ...a, id: a.id };
}

/** Drop rows that are strict subsets of another row in the same file (same display + size). */
export function pruneRedundantTokenRows(
  merged: TypographyStyleRow[],
  fromTokens: TypographyStyleRow[],
): TypographyStyleRow[] {
  const mergedKeys = new Set(
    merged.map((r) => `${r.sourcePath}|${r.displayName.toLowerCase()}|${(r.fontSize ?? "").toLowerCase()}`),
  );
  return fromTokens.filter(
    (r) => !mergedKeys.has(`${r.sourcePath}|${r.displayName.toLowerCase()}|${(r.fontSize ?? "").toLowerCase()}`),
  );
}
