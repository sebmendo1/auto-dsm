import type { ParseResult } from "./types";
import { parseCSSVariables } from "./css-parser";
import { parseTailwindConfig } from "./tailwind-parser";

export * from "./types";
export { parseCSSVariables } from "./css-parser";
export { parseTailwindConfig, extractTypographyStyleRowsFromTailwind } from "./tailwind-parser";
export {
  cssContentToTypographyRows,
  dedupeTypographyRows,
  makeRowId,
  firstFamilyDisplayName,
  typographyTokensToRows,
  pruneRedundantTokenRows,
} from "./typography-style-rows";

export function parseCode(content: string, fileType: "css" | "tailwind"): ParseResult {
  const parsed =
    fileType === "css" ? parseCSSVariables(content) : parseTailwindConfig(content);
  return { ...parsed, typographyRows: [], assets: [] };
}

export function autoDetectAndParse(content: string): ParseResult {
  const isTailwind = /theme\s*:|module\.exports|export\s+default/.test(content);
  const parsed = isTailwind ? parseTailwindConfig(content) : parseCSSVariables(content);
  return { ...parsed, typographyRows: [], assets: [] };
}
