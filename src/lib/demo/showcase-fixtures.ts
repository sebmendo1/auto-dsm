import type { DiscoveredComponent } from "@/lib/github/types";
import type { ParseResult, RepoAsset, TypographyStyleRow } from "@/lib/parser/types";

/** Minimal Sandpack source for every demo component slug (design shell only). */
export const DEMO_SANDBOX_SOURCE = `import React from "react";

export default function ShowcaseDemo() {
  return (
    <div
      style={{
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.875rem",
        lineHeight: 1.5,
        color: "#141418",
        background: "#f3f3f5",
        borderRadius: "0.625rem",
      }}
    >
      <strong>Demo preview</strong>
      <p style={{ margin: "0.5rem 0 0", opacity: 0.85 }}>
        VITE_USE_DEMO_DATA — design shell. Replace with GitHub scraper output later.
      </p>
    </div>
  );
}
`;

export const DEMO_COMPONENTS: DiscoveredComponent[] = [
  {
    name: "Button",
    fileName: "Button.tsx",
    filePath: "src/components/ui/Button.tsx",
    slug: "button",
    category: "Forms",
    hasIndex: true,
    exports: ["Button"],
    relatedStylePaths: [],
  },
  {
    name: "Input",
    fileName: "Input.tsx",
    filePath: "src/components/ui/Input.tsx",
    slug: "input",
    category: "Forms",
    hasIndex: true,
    exports: ["Input"],
    relatedStylePaths: [],
  },
  {
    name: "Card",
    fileName: "Card.tsx",
    filePath: "src/components/ui/Card.tsx",
    slug: "card",
    category: "Layout",
    hasIndex: true,
    exports: ["Card"],
    relatedStylePaths: [],
  },
  {
    name: "Alert — long label for truncation testing in the sidebar navigation rail",
    fileName: "Alert.tsx",
    filePath: "src/components/ui/Alert.tsx",
    slug: "alert",
    category: "Feedback",
    hasIndex: true,
    exports: ["Alert"],
    relatedStylePaths: [],
  },
  {
    name: "Modal",
    fileName: "Modal.tsx",
    filePath: "src/components/ui/Modal.tsx",
    slug: "modal",
    category: "Overlay",
    hasIndex: true,
    exports: ["Modal"],
    relatedStylePaths: [],
  },
  {
    name: "Tabs",
    fileName: "Tabs.tsx",
    filePath: "src/components/ui/Tabs.tsx",
    slug: "tabs",
    category: "Navigation",
    hasIndex: true,
    exports: ["Tabs"],
    relatedStylePaths: [],
  },
  {
    name: "Badge",
    fileName: "Badge.tsx",
    filePath: "src/components/ui/Badge.tsx",
    slug: "badge",
    category: "Data display",
    hasIndex: true,
    exports: ["Badge"],
    relatedStylePaths: [],
  },
  {
    name: "Select",
    fileName: "Select.tsx",
    filePath: "src/components/ui/Select.tsx",
    slug: "select",
    category: "Forms",
    hasIndex: true,
    exports: ["Select"],
    relatedStylePaths: [],
  },
];

const DEMO_TYPOGRAPHY_ROWS: TypographyStyleRow[] = [
  {
    id: "h1",
    displayName: "H1",
    fontFamily: "system-ui",
    fontFamilyCss: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "2.25rem",
    lineHeight: "1.2",
    letterSpacing: "-0.02em",
    fontWeight: "700",
    sourcePath: "theme/typography.ts",
  },
  {
    id: "h2",
    displayName: "H2",
    fontFamily: "system-ui",
    fontFamilyCss: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "1.875rem",
    lineHeight: "1.25",
    fontWeight: "700",
    sourcePath: "theme/typography.ts",
  },
  {
    id: "body",
    displayName: "Body",
    fontFamily: "system-ui",
    fontFamilyCss: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "1rem",
    lineHeight: "1.5",
    fontWeight: "400",
    sourcePath: "theme/typography.ts",
  },
  {
    id: "caption",
    displayName: "Caption",
    fontFamily: "system-ui",
    fontFamilyCss: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
    fontSize: "0.75rem",
    lineHeight: "1.4",
    fontWeight: "500",
    sourcePath: "theme/typography.ts",
  },
];

const DEMO_ASSETS: RepoAsset[] = [
  {
    path: "public/hero.png",
    name: "hero.png",
    extension: "png",
    size: 128400,
    rawUrl: "https://placehold.co/800x450/6d58ff/ffffff/png?text=Hero",
    htmlUrl: "https://placehold.co/800x450/6d58ff/ffffff/png?text=Hero",
  },
  {
    path: "public/icons/check.svg",
    name: "check.svg",
    extension: "svg",
    size: 820,
    rawUrl: "https://placehold.co/120x120/5b47d6/ffffff/svg?text=OK",
    htmlUrl: "https://placehold.co/120x120/5b47d6/ffffff/svg?text=OK",
  },
  {
    path: "src/assets/logo-mark.png",
    name: "logo-mark.png",
    extension: "png",
    size: 45200,
    rawUrl: "https://placehold.co/256x256/7c6cff/ffffff/png?text=Logo",
    htmlUrl: "https://placehold.co/256x256/7c6cff/ffffff/png?text=Logo",
  },
];

/** Sample tokens aligned with AutoDSM default palette (filled-state demo only). */
export const DEMO_PARSE_RESULT: ParseResult = {
  colors: [
    { name: "brand-500", value: "#6d58ff", category: "primary" },
    { name: "brand-600", value: "#5b47d6", category: "primary" },
    { name: "brand-soft", value: "rgba(109, 88, 255, 0.12)", category: "primary" },
    { name: "surface-base", value: "#f3f3f5", category: "neutral" },
    { name: "surface-card", value: "#ffffff", category: "neutral" },
    { name: "content-primary", value: "#141418", category: "neutral" },
    { name: "content-muted", value: "#6b6b76", category: "neutral" },
    { name: "success-500", value: "#00d084", category: "success" },
    { name: "error-500", value: "#ef4444", category: "error" },
    { name: "info-500", value: "#0070f3", category: "info" },
  ],
  typography: [
    { name: "font-sans", value: "system-ui, sans-serif" },
    { name: "font-mono", value: "ui-monospace, monospace" },
    { name: "font-size-xs", value: "0.75rem" },
    { name: "font-size-sm", value: "0.875rem" },
    { name: "font-size-md", value: "1rem" },
    { name: "font-size-lg", value: "1.125rem" },
    { name: "font-size-xl", value: "1.25rem" },
    { name: "font-size-2xl", value: "1.5rem" },
  ],
  typographyRows: DEMO_TYPOGRAPHY_ROWS,
  assets: DEMO_ASSETS,
};
