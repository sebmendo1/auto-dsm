import type { ColorToken, TypographyToken, TypographyStyleRow } from "./types";
import { firstFamilyDisplayName, makeRowId } from "./typography-style-rows";

export function parseTailwindConfig(content: string): {
  colors: ColorToken[];
  typography: TypographyToken[];
} {
  const colors = extractColors(content);
  const typography = [...extractFontSizes(content), ...extractFontFamilies(content)];
  return { colors, typography };
}

function extractColors(content: string): ColorToken[] {
  const colors: ColorToken[] = [];
  const pattern = /['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    const value = match[2];
    if (["xs", "sm", "md", "lg", "xl", "2xl", "3xl"].includes(name)) continue;
    if (!isColorValue(name, value)) continue;

    colors.push({
      name,
      value,
      category: inferCategory(name),
    });
  }

  return colors;
}

function isColorValue(name: string, value: string): boolean {
  const lower = name.toLowerCase();
  if (["color", "bg", "background", "border", "fill"].some((k) => lower.includes(k))) {
    return true;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true;
  if (/^(rgb|hsl|oklch|oklab)/i.test(value)) return true;
  if (/var\(--/.test(value)) return true;
  return false;
}

export function extractTypographyStyleRowsFromTailwind(
  content: string,
  sourcePath: string,
): TypographyStyleRow[] {
  const sizes = extractFontSizes(content);
  const families = extractFontFamilies(content);
  const sansStack =
    families.find((f) => f.name === "font-sans" || /sans$/i.test(f.name))?.value ??
    families[0]?.value ??
    "ui-sans-serif, system-ui, sans-serif";

  return sizes.map((t) => ({
    id: makeRowId(sourcePath, `text-${t.name}`, t.value, sansStack),
    displayName: `Text ${t.name}`,
    fontFamily: firstFamilyDisplayName(sansStack),
    fontFamilyCss: sansStack,
    fontSize: t.value,
    lineHeight: t.lineHeight,
    sourcePath,
  }));
}

function extractFontSizes(content: string): TypographyToken[] {
  const typography: TypographyToken[] = [];
  const fontSizeSection = content.match(/fontSize\s*:\s*{([^}]+)}/s);

  if (fontSizeSection) {
    const section = fontSizeSection[1];

    const tuplePattern =
      /['"]?([\w-]+)['"]?\s*:\s*\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;

    while ((match = tuplePattern.exec(section)) !== null) {
      typography.push({
        name: match[1],
        value: match[2],
        lineHeight: match[3],
      });
    }

    const simplePattern =
      /['"]?([\w-]+)['"]?\s*:\s*['"](\d+(?:\.\d+)?(?:px|rem|em))['"](?!\s*,\s*['"])/g;
    while ((match = simplePattern.exec(section)) !== null) {
      const m = match;
      if (!typography.find((t) => t.name === m[1])) {
        typography.push({ name: m[1], value: m[2] });
      }
    }
  }

  return typography;
}

function extractFontFamilies(content: string): TypographyToken[] {
  const typography: TypographyToken[] = [];
  const fontFamilySection = content.match(/fontFamily\s*:\s*{([^}]+)}/s);

  if (fontFamilySection) {
    const section = fontFamilySection[1];

    const arrayPattern = /['"]?([\w-]+)['"]?\s*:\s*\[([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    while ((match = arrayPattern.exec(section)) !== null) {
      const name = match[1];
      const raw = match[2];
      const families = raw
        .split(",")
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      typography.push({ name: `font-${name}`, value: families.join(", ") });
    }

    const simplePattern = /['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
    while ((match = simplePattern.exec(section)) !== null) {
      const m = match;
      if (!typography.find((t) => t.name === `font-${m[1]}`)) {
        typography.push({ name: `font-${m[1]}`, value: m[2] });
      }
    }
  }

  return typography;
}

function inferCategory(name: string): string | null {
  const lower = name.toLowerCase();
  const baseMatch = lower.match(/^([\w-]+?)[-_]?\d+$/);
  if (baseMatch) return baseMatch[1];

  const categories = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "gray",
    "slate",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
  ];
  for (const cat of categories) {
    if (lower.includes(cat)) return cat;
  }
  return null;
}
