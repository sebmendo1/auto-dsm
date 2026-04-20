/**
 * fonts.ts — Font detection from layout files and CSS.
 * PDF §10 — source 6: Font detection.
 *
 * Detects:
 *   - next/font/google imports
 *   - next/font/local imports
 *   - geist/font/sans + geist/font/mono
 *   - @import url("...fonts.googleapis...")
 *   - @font-face { font-family: ...; }
 *   - CSS variables named --font-*
 */

import type { BrandFont } from "@/lib/brand/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function weightName(w: string): string {
  const map: Record<string, string> = {
    "100": "Thin",
    "200": "ExtraLight",
    "300": "Light",
    "400": "Regular",
    "500": "Medium",
    "600": "SemiBold",
    "700": "Bold",
    "800": "ExtraBold",
    "900": "Black",
  };
  return map[w] ?? w;
}

function inferRole(
  family: string
): BrandFont["role"] {
  const f = family.toLowerCase();
  if (/mono|code|courier|consolas|fira|hack|jetbrains/.test(f)) return "code";
  if (/display|heading|title|banner/.test(f)) return "display";
  if (/secondary/.test(f)) return "secondary";
  return "primary";
}

function parseWeightList(raw: string): BrandFont["weights"] {
  // raw might be "[400, 700]" or "400" or "700"
  const nums = raw.match(/\d+/g) ?? [];
  return nums.map((w) => ({ value: w, name: weightName(w) }));
}

// ─── next/font/google / next/font/local ──────────────────────────────────────

interface NextFontCall {
  family: string;
  weights: string[];
  subsets: string[];
  variable: string | null;
  display: string | null;
  importMethod: BrandFont["importMethod"];
}

function parseNextFontCalls(source: string): NextFontCall[] {
  const results: NextFontCall[] = [];

  // Match: import { Inter, Roboto } from "next/font/google"
  // Or: import Inter from "next/font/google"
  const importRegex =
    /import\s+\{([^}]+)\}\s+from\s+["']next\/font\/google["']/g;
  const singleImportRegex =
    /import\s+(\w+)\s+from\s+["']next\/font\/google["']/g;
  const localImportRegex =
    /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+["']next\/font\/local["']/g;

  const googleFonts: string[] = [];
  const localFonts: string[] = [];
  const geistFonts: string[] = [];

  // Check geist package
  const geistSansMatch = source.match(
    /import\s*\{?\s*(\w+)\s*\}?\s*from\s*["']geist(?:\/font)?(?:\/sans)?["']/
  );
  if (geistSansMatch) geistFonts.push(geistSansMatch[1]);
  const geistMonoMatch = source.match(
    /import\s*\{?\s*(\w+)\s*\}?\s*from\s*["']geist(?:\/font)?(?:\/mono)?["']/
  );
  if (geistMonoMatch && geistMonoMatch[1] !== geistSansMatch?.[1]) {
    geistFonts.push(geistMonoMatch[1]);
  }

  // Collect google font variable names
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(source)) !== null) {
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    googleFonts.push(...names);
  }
  while ((m = singleImportRegex.exec(source)) !== null) {
    googleFonts.push(m[1]);
  }
  while ((m = localImportRegex.exec(source)) !== null) {
    const names = (m[1] ?? m[2])
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    localFonts.push(...names);
  }

  // Now find the instantiation for each variable name
  const allGroups = [
    { names: googleFonts, method: "next/font/google" as const },
    { names: localFonts, method: "next/font/local" as const },
    { names: geistFonts, method: "geist" as const },
  ];

  for (const { names, method } of allGroups) {
    for (const varName of names) {
      // Find the call: const inter = Inter({ ... }) or const inter = Inter({...})
      const callPattern = new RegExp(
        `(?:const|let|var)\\s+${varName}\\s*=\\s*(?:[\\w]+\\s*\\(|${varName}\\s*\\()([\\s\\S]*?)\\)`,
        "m"
      );
      const callMatch = source.match(callPattern);

      // Also look for direct const X = FontName({ })
      const familyName = guessFamily(varName, source, method);

      const weights: string[] = [];
      const subsets: string[] = [];
      let variable: string | null = null;
      let display: string | null = null;

      if (callMatch) {
        const body = callMatch[1];
        // Extract weights
        const wMatch = body.match(/weight[s]?\s*:\s*\[([^\]]+)\]/);
        if (wMatch) weights.push(...(wMatch[1].match(/[\d"']+/g)?.map(s => s.replace(/['"]/g, '')) ?? []));
        const wSingle = body.match(/weight\s*:\s*["']?(\d+)["']?/);
        if (wSingle) weights.push(wSingle[1]);
        // subsets
        const sMatch = body.match(/subsets?\s*:\s*\[([^\]]+)\]/);
        if (sMatch) subsets.push(...(sMatch[1].match(/["'][^"']+["']/g)?.map(s => s.replace(/['"]/g, '')) ?? []));
        // variable
        const vMatch = body.match(/variable\s*:\s*["']([^"']+)["']/);
        if (vMatch) variable = vMatch[1];
        // display
        const dMatch = body.match(/display\s*:\s*["']([^"']+)["']/);
        if (dMatch) display = dMatch[1];
      }

      if (weights.length === 0) weights.push("400");

      results.push({
        family: familyName,
        weights,
        subsets,
        variable,
        display,
        importMethod: method,
      });
    }
  }

  return results;
}

function guessFamily(
  varName: string,
  source: string,
  method: BrandFont["importMethod"]
): string {
  if (method === "geist") {
    if (/mono/i.test(varName)) return "Geist Mono";
    return "Geist Sans";
  }
  // Try to find: const inter = Inter({ — take "Inter"
  const ctorMatch = source.match(
    new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*(\\w+)\\s*\\(`)
  );
  if (ctorMatch) {
    // Convert PascalCase to spaced: "NotoSans" -> "Noto Sans"
    return ctorMatch[1].replace(/([A-Z])/g, " $1").trim();
  }
  return varName;
}

// ─── @import url() googleapis ────────────────────────────────────────────────

function parseGoogleFontImports(
  source: string,
  filename: string
): BrandFont[] {
  const results: BrandFont[] = [];
  const re =
    /@import\s+url\s*\(\s*["']?([^"')]+fonts\.googleapis\.com[^"')]*?)["']?\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const url = m[1];
    // Parse family and weights from Google Fonts URL
    // e.g. ?family=Roboto:wght@400;700&family=Inter:ital,wght@0,400;1,700
    const familyMatches = [...url.matchAll(/family=([^&:]+)(?::[^&]*)?/g)];
    for (const fm of familyMatches) {
      const family = fm[1].replace(/\+/g, " ");
      const weightsInUrl = url.match(/wght@([\d;,|]+)/);
      const wts = weightsInUrl
        ? weightsInUrl[1].match(/\d{3}/g) ?? ["400"]
        : ["400"];
      const weights = [...new Set(wts)].map((w) => ({
        value: w,
        name: weightName(w),
      }));
      results.push({
        family,
        importMethod: "@import",
        source: filename,
        weights,
        styles: ["normal"],
        fallbacks: ["sans-serif"],
        role: inferRole(family),
      });
    }
  }
  return results;
}

// ─── @font-face ───────────────────────────────────────────────────────────────

function parseFontFaces(source: string, filename: string): BrandFont[] {
  const results: BrandFont[] = [];
  const re = /@font-face\s*\{([^}]+)\}/gs;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const block = m[1];
    const familyMatch = block.match(
      /font-family\s*:\s*["']?([^"';,\n]+)["']?/
    );
    const weightMatch = block.match(/font-weight\s*:\s*([\w\s]+)/);
    const styleMatch = block.match(/font-style\s*:\s*([\w]+)/);
    if (!familyMatch) continue;
    const family = familyMatch[1].trim().replace(/['"]/g, "");
    const weight = weightMatch?.[1]?.trim() ?? "400";
    const style = styleMatch?.[1]?.trim() ?? "normal";
    const existing = results.find((r) => r.family === family);
    if (existing) {
      if (!existing.weights.find((w) => w.value === weight)) {
        existing.weights.push({ value: weight, name: weightName(weight) });
      }
      if (!existing.styles.includes(style)) existing.styles.push(style);
    } else {
      results.push({
        family,
        importMethod: "@font-face",
        source: filename,
        weights: [{ value: weight, name: weightName(weight) }],
        styles: [style],
        fallbacks: ["sans-serif"],
        role: inferRole(family),
      });
    }
  }
  return results;
}

// ─── CSS --font-* variables ────────────────────────────────────────────────────

function parseCssFontVars(source: string, filename: string): BrandFont[] {
  const results: BrandFont[] = [];
  const re = /(--font-[\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const variable = m[1];
    const value = m[2].trim();
    const family = value.replace(/['"]/g, "").split(",")[0].trim();
    if (!family || family.startsWith("var(")) continue;
    results.push({
      family,
      importMethod: "css-variable",
      source: filename,
      weights: [{ value: "400", name: "Regular" }],
      styles: ["normal"],
      variable,
      fallbacks: [],
      role: inferRole(family),
    });
  }
  return results;
}

// ─── Main API ─────────────────────────────────────────────────────────────────

export interface FontFileInput {
  path: string;
  content: string;
}

/**
 * Detect fonts from a set of source files (layout, CSS, etc.).
 * Returns deduplicated BrandFont[].
 */
export function detectFonts(files: FontFileInput[]): BrandFont[] {
  const all: BrandFont[] = [];

  for (const { path, content } of files) {
    try {
      const isTS = /\.[jt]sx?$/.test(path);
      const isCSS = /\.s?[ac]ss$/.test(path);

      if (isTS) {
        const calls = parseNextFontCalls(content);
        for (const call of calls) {
          const weights =
            call.weights.length > 0
              ? call.weights.map((w) => ({ value: w, name: weightName(w) }))
              : [{ value: "400", name: "Regular" }];
          all.push({
            family: call.family,
            importMethod: call.importMethod,
            source: path,
            weights,
            styles: ["normal"],
            variable: call.variable ?? undefined,
            subsets: call.subsets.length > 0 ? call.subsets : undefined,
            displayStrategy: call.display ?? undefined,
            fallbacks: ["sans-serif"],
            role: inferRole(call.family),
          });
        }
      }

      if (isCSS) {
        all.push(...parseGoogleFontImports(content, path));
        all.push(...parseFontFaces(content, path));
        all.push(...parseCssFontVars(content, path));
      }
    } catch {
      // Permissive — skip malformed files
    }
  }

  // Deduplicate by family+importMethod
  const seen = new Set<string>();
  return all.filter((f) => {
    const key = `${f.family}::${f.importMethod}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { parseWeightList };
