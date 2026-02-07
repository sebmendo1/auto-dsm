export interface GitHubFile {
  path: string;
  name: string;
  type: "file" | "dir";
  sha: string;
  size: number;
  url: string;
}

export interface ThemeFileCandidate {
  path: string;
  tier: 1 | 2 | 3 | 4;
  type: "theme" | "tokens" | "colors" | "css" | "tailwind" | "config";
  confidence: number;
}

export interface FetchedFile {
  path: string;
  content: string;
  encoding: string;
}

export interface ExtractedColors {
  source: string;
  colors: Array<{
    name: string;
    value: string;
    category: string | null;
  }>;
}

export interface FontInfo {
  name: string;
  openSource: boolean;
  source: "google" | "css" | "unknown";
}

export interface ExtractedTypography {
  source: string;
  typography: Array<{
    name: string;
    value: string;
    lineHeight?: string;
  }>;
  fonts: FontInfo[];
}

export interface DiscoveredComponent {
  name: string;
  fileName: string;
  filePath: string;
  slug: string;
  category?: string;
  hasIndex: boolean;
  exports?: string[];
}

export interface ComponentDiscoveryResult {
  success: boolean;
  repo: string;
  componentPaths: string[];
  components: DiscoveredComponent[];
  totalCount: number;
}
