/**
 * Smoke tests for merged typography rows (run: npx tsx scripts/test-typography-rows.ts).
 */
import assert from "node:assert/strict";
import {
  cssContentToTypographyRows,
  dedupeTypographyRows,
  typographyTokensToRows,
} from "../src/lib/parser/typography-style-rows";
import { extractTypographyStyleRowsFromTailwind } from "../src/lib/parser/tailwind-parser";

const cssFixture = `
.page-title {
  font-size: 48px;
  line-height: 56px;
  letter-spacing: -0.02em;
  font-weight: 700;
  font-family: "Geist", system-ui, sans-serif;
}
`;

const twFixture = `
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        lg: ["18px", "28px"],
        sm: "14px",
      },
    },
  },
};
`;

function main() {
  const cssRows = cssContentToTypographyRows(cssFixture, "app/globals.css");
  assert.equal(cssRows.length, 1, "one CSS rule row");
  const r0 = cssRows[0];
  assert.equal(r0.displayName, "page title");
  assert.equal(r0.fontSize, "48px");
  assert.equal(r0.lineHeight, "56px");
  assert.equal(r0.letterSpacing, "-0.02em");
  assert.equal(r0.fontWeight, "700");
  assert.ok(r0.fontFamilyCss.includes("Geist"));

  const twRows = extractTypographyStyleRowsFromTailwind(twFixture, "tailwind.config.ts");
  assert.ok(twRows.length >= 2, "tailwind fontSize rows");
  const lg = twRows.find((r) => r.displayName === "Text lg");
  assert.ok(lg, "Text lg row");
  assert.equal(lg?.fontSize, "18px");
  assert.equal(lg?.lineHeight, "28px");
  assert.ok(lg?.fontFamilyCss.toLowerCase().includes("inter"));

  const tokenRows = typographyTokensToRows(
    [
      { name: "custom", value: "20px", lineHeight: "28px" },
      { name: "font-sans", value: "Inter, system-ui" },
    ],
    [{ name: "Inter", openSource: true, source: "google" }],
    "tokens.css",
  );
  assert.ok(tokenRows.some((t) => t.fontSize === "20px"));

  const merged = dedupeTypographyRows([...cssRows, ...cssRows]);
  assert.equal(merged.length, 1, "dedupe collapses identical rows");

  console.log("typography-style-rows: all checks passed.");
}

main();
