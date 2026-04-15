export interface ColorToken {
  name: string;
  value: string;
  category: string | null;
}

export interface TypographyToken {
  name: string;
  value: string;
  lineHeight?: string;
}

/** Merged style for one row on the Typography dashboard (repo-derived). */
export interface TypographyStyleRow {
  id: string;
  displayName: string;
  /** Short label for the font family column (first family in the stack). */
  fontFamily: string;
  /** Full `font-family` CSS value for previews. */
  fontFamilyCss: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: string;
  sourcePath: string;
}

/** Image file discovered in a connected GitHub repo (tree + raw URLs only). */
export interface RepoAsset {
  path: string;
  name: string;
  extension: string;
  size: number;
  rawUrl: string;
  htmlUrl: string;
}

export interface ParseResult {
  colors: ColorToken[];
  typography: TypographyToken[];
  /** Normalized rows from GitHub extraction (optional for backward compat). */
  typographyRows?: TypographyStyleRow[];
  /** Raster/vector images from the repo tree (optional). */
  assets?: RepoAsset[];
}
