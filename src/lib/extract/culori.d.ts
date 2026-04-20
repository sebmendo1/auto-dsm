/**
 * Minimal type declarations for culori v4.
 * The package ships ESM-only types; this shim covers what the extraction
 * engine actually uses.
 */
declare module "culori" {
  export interface ColorHsl {
    mode: "hsl";
    h?: number;
    s?: number;
    l?: number;
    alpha?: number;
  }

  export interface ColorRgb {
    mode: "rgb";
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
  }

  export interface ColorOklch {
    mode: "oklch";
    l?: number;
    c?: number;
    h?: number;
    alpha?: number;
  }

  export type Color = {
    mode: string;
    h?: number;
    s?: number;
    l?: number;
    r?: number;
    g?: number;
    b?: number;
    c?: number;
    alpha?: number;
    [k: string]: number | string | undefined;
  };

  export function parse(value: string): Color | undefined;
  export function formatHex(color: Color | undefined): string;
  export function formatHsl(color: Color | undefined): string;
  export function serializeHsl(color: Color | undefined): string;

  /** Returns a converter function for the given color space. */
  export function converter(
    mode: string
  ): (color: Color | string) => Color;

  /** WCAG 2.1 contrast ratio between two colors. */
  export function wcagContrast(
    a: Color | string,
    b: Color | string
  ): number;

  /** WCAG 2.1 luminance of a color. */
  export function wcagLuminance(color: Color | string): number;
}
