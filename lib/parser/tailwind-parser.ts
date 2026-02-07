import type { ColorToken, TypographyToken } from "./types";

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
      if (!typography.find((t) => t.name === match[1])) {
        typography.push({ name: match[1], value: match[2] });
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
      if (!typography.find((t) => t.name === `font-${match[1]}`)) {
        typography.push({ name: `font-${match[1]}`, value: match[2] });
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
