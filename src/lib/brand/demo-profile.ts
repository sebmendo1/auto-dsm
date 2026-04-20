import type { BrandProfile } from "./types";

/**
 * Synthetic BrandProfile for local UI preview (DEV_AUTH_BYPASS).
 * Keeps every token category non-empty so dashboard routes render.
 */
export function buildDemoBrandProfile(owner: string, name: string): BrandProfile {
  const slug = `${owner}/${name}`;
  const url = `https://github.com/${slug}`;
  const iso = new Date().toISOString();

  return {
    repo: {
      owner,
      name,
      branch: "main",
      url,
    },
    scannedAt: iso,
    scannedFromSha: "dev-preview",
    meta: {
      filesScanned: 42,
      cssSource: "app/globals.css (dev preview)",
      tailwindConfigPath: "tailwind.config.ts",
      shadcnConfigPath: "components.json",
      tailwindVersion: "4",
    },
    colors: [
      {
        name: "primary",
        cssVariable: "--primary",
        value: "#8f23fa",
        hsl: "271 91% 38%",
        rgb: "rgb(143 35 250)",
        group: "brand",
        source: "globals.css (preview)",
        contrastOnWhite: 4.8,
        contrastOnBlack: 4.2,
        wcagAANormal: true,
        wcagAALarge: true,
        wcagAAA: false,
      },
      {
        name: "background",
        cssVariable: "--background",
        value: "#ffffff",
        hsl: "0 0% 100%",
        rgb: "rgb(255 255 255)",
        group: "surface",
        source: "globals.css (preview)",
        contrastOnWhite: 1,
        contrastOnBlack: 21,
        wcagAANormal: true,
        wcagAALarge: true,
        wcagAAA: true,
      },
    ],
    typography: [
      {
        name: "text-h1",
        fontFamily: "var(--font-manrope), sans-serif",
        fontSize: "2rem",
        fontSizePx: 32,
        fontWeight: "700",
        fontWeightNumeric: 700,
        lineHeight: "1.2",
        letterSpacing: "-0.02em",
        source: "globals.css (preview)",
        category: "heading",
        tailwindClass: "text-h1",
      },
    ],
    fonts: [
      {
        family: "Geist Sans",
        importMethod: "next/font/google",
        source: "app/layout.tsx",
        weights: [{ value: "400", name: "Regular" }],
        styles: ["normal"],
        role: "primary",
        fallbacks: ["system-ui", "sans-serif"],
      },
    ],
    spacing: [
      {
        name: "4",
        tailwindClass: "p-4",
        rem: "1rem",
        px: 16,
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    shadows: [
      {
        name: "shadow-md",
        tailwindClass: "shadow-md",
        value: "0 4px 12px rgba(0,0,0,0.08)",
        layers: [
          {
            offsetX: "0",
            offsetY: "4px",
            blur: "12px",
            spread: "0",
            color: "rgba(0,0,0,0.08)",
            colorHex: "#00000014",
            inset: false,
          },
        ],
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    radii: [
      {
        name: "rounded-lg",
        tailwindClass: "rounded-lg",
        value: "0.5rem",
        px: 8,
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    borders: [
      {
        name: "default",
        width: "1px",
        style: "solid",
        color: "#e5e5e7",
        source: "globals.css (preview)",
      },
    ],
    animations: [
      {
        name: "pulse",
        type: "keyframes",
        tailwindClass: "animate-pulse",
        duration: "2s",
        timingFunction: "cubic-bezier(0.4, 0, 0.6, 1)",
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    breakpoints: [
      {
        name: "sm",
        value: "640px",
        px: 640,
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    opacity: [
      {
        name: "50",
        value: 0.5,
        percentage: "50%",
        source: "tailwind (preview)",
        isCustom: false,
      },
    ],
    zIndex: [
      {
        name: "50",
        value: 50,
        tailwindClass: "z-50",
        source: "tailwind (preview)",
        isCustom: false,
        inferredRole: "modal",
      },
    ],
    gradients: [
      {
        name: "hero",
        type: "linear",
        cssValue: "linear-gradient(135deg, #8f23fa 0%, #5b21b6 100%)",
        stops: [
          { color: "primary", colorHex: "#8f23fa", position: "0%" },
          { color: "secondary", colorHex: "#5b21b6", position: "100%" },
        ],
        direction: "135deg",
        source: "globals.css (preview)",
      },
    ],
    assets: [
      {
        name: "logo",
        path: "public/logo.svg",
        type: "svg",
        category: "logo",
        dimensions: { width: 120, height: 40 },
        fileSize: 2048,
        fileSizeFormatted: "2 KB",
      },
    ],
  };
}
