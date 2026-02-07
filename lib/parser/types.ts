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

export interface ParseResult {
  colors: ColorToken[];
  typography: TypographyToken[];
}
