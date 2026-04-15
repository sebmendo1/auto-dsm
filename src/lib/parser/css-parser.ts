import type { ColorToken, TypographyToken } from "./types";

export function parseCSSVariables(content: string): {
  colors: ColorToken[];
  typography: TypographyToken[];
} {
  const colors: ColorToken[] = [];
  const typography: TypographyToken[] = [];

  const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();

    if (value.startsWith("var(")) continue;

    const normalized = normalizeColorValue(name, value);
    if (normalized) {
      colors.push({
        name,
        value: normalized,
        category: inferCategory(name),
      });
    } else if (isTypography(name)) {
      typography.push({ name, value });
    }
  }

  return { colors, typography };
}

function isColor(name: string, value: string): boolean {
  const colorKeywords = ["color", "bg", "background", "border", "fill"];
  if (colorKeywords.some((k) => name.toLowerCase().includes(k))) return true;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) return true;
  if (/^(rgb|hsl|oklch|oklab)/i.test(value)) return true;
  if (/^\\d+\\s+\\d+(\\.\\d+)?%\\s+\\d+(\\.\\d+)?%/.test(value)) return true;
  return false;
}

function isTypography(name: string): boolean {
  const keywords = ["font", "text", "line-height", "letter-spacing", "leading", "tracking"];
  return keywords.some((k) => name.toLowerCase().includes(k));
}

function inferCategory(name: string): string | null {
  const categories = [
    "primary",
    "secondary",
    "accent",
    "neutral",
    "gray",
    "slate",
    "zinc",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "purple",
    "pink",
    "success",
    "warning",
    "error",
    "danger",
    "muted",
    "background",
    "foreground",
  ];
  const lower = name.toLowerCase();
  for (const cat of categories) {
    if (lower.includes(cat)) return cat;
  }
  return null;
}

function normalizeColorValue(name: string, value: string): string | null {
  if (!isColor(name, value)) return null;
  if (/^\\d+\\s+\\d+(\\.\\d+)?%\\s+\\d+(\\.\\d+)?%/.test(value)) {
    return `hsl(${value})`;
  }
  return value;
}
