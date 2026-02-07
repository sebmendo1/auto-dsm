import type { ExtractedColors, ExtractedTypography, FontInfo, GitHubFile } from "./types";
import { findThemeFiles } from "./patterns";
import { parseCSSVariables } from "@/lib/parser/css-parser";
import { parseTailwindConfig } from "@/lib/parser/tailwind-parser";

function parseRepoFullName(repoFullName: string): { owner: string; repo: string } {
  const parts = repoFullName.replace("https://github.com/", "").split("/");
  if (parts.length < 2) {
    throw new Error("Repo must be in owner/repo format");
  }
  return { owner: parts[0], repo: parts[1] };
}

function createHeaders(accessToken?: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function getDefaultBranch(owner: string, repo: string, accessToken?: string) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: createHeaders(accessToken),
  });
  if (!res.ok) throw new Error("Failed to fetch repo info");
  const data = await res.json();
  return data.default_branch ?? "main";
}

async function getRepoTree(
  owner: string,
  repo: string,
  branch: string,
  accessToken?: string,
): Promise<GitHubFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: createHeaders(accessToken) },
  );
  if (!res.ok) throw new Error("Failed to fetch repo tree");
  const data = await res.json();
  return (data.tree ?? [])
    .filter((item: any) => item.type === "blob" && item.path)
    .map((item: any) => ({
      path: item.path as string,
      name: (item.path as string).split("/").pop() ?? item.path,
      type: "file" as const,
      sha: item.sha as string,
      size: item.size ?? 0,
      url: item.url as string,
    }));
}

async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
  );
  if (!res.ok) throw new Error(`Unable to fetch ${path}`);
  return res.text();
}

export async function extractColorsFromRepo(
  repoFullName: string,
  accessToken?: string,
  options?: { branch?: string; maxFiles?: number },
): Promise<ExtractedColors[]> {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const branch = options?.branch ?? (await getDefaultBranch(owner, repo, accessToken));
  const maxFiles = options?.maxFiles ?? 5;

  const tree = await getRepoTree(owner, repo, branch, accessToken);
  const candidates = findThemeFiles(tree.map((file) => file.path));
  const cssCandidates = candidates.filter((candidate) => candidate.type === "css");

  const fallbackCss = tree
    .map((file) => file.path)
    .filter((path) => {
      const lower = path.toLowerCase();
      return lower.endsWith(".css") || lower.endsWith(".astro");
    })
    .slice(0, maxFiles);

  const selected =
    cssCandidates.length > 0
      ? cssCandidates.slice(0, maxFiles)
      : fallbackCss.map((path) => ({ path }));

  if (selected.length === 0) return [];

  const results: ExtractedColors[] = [];

  for (const candidate of selected) {
    try {
      const content = await getFileContent(owner, repo, candidate.path, branch);
      const cssBlocks = extractCssBlocks(candidate.path, content);
      const colors = cssBlocks.flatMap((block) => parseCSSVariables(block).colors);
      if (colors.length > 0) {
        results.push({ source: candidate.path, colors });
      }
    } catch {
      // Ignore per-file errors to keep parsing resilient
    }
  }

  return results;
}

function extractGoogleFontsFromUrl(content: string): FontInfo[] {
  const fonts = new Map<string, FontInfo>();
  const urlPattern = /https?:\/\/fonts\.googleapis\.com\/css2?\?[^'"\s>)]*/gi;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0];
    const families = url
      .split("family=")
      .slice(1)
      .map((segment) => segment.split("&")[0])
      .map((family) => family.replace(/\+/g, " ").split(":")[0])
      .map((family) => decodeURIComponent(family));

    for (const family of families) {
      const name = family.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      fonts.set(key, {
        name,
        openSource: true,
        source: "google",
      });
    }
  }

  return Array.from(fonts.values());
}

function extractGoogleFontsFromNext(content: string): FontInfo[] {
  const fonts = new Map<string, FontInfo>();
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]next\/font\/google['"]/gi;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const raw = match[1];
    const names = raw
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) =>
        name
          .replace(/_/g, " ")
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .trim(),
      );
    for (const name of names) {
      if (!name) continue;
      const key = name.toLowerCase();
      fonts.set(key, { name, openSource: true, source: "google" });
    }
  }

  return Array.from(fonts.values());
}

export async function extractTypographyFromRepo(
  repoFullName: string,
  accessToken?: string,
  options?: { branch?: string; maxFiles?: number },
): Promise<ExtractedTypography[]> {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const branch = options?.branch ?? (await getDefaultBranch(owner, repo, accessToken));
  const maxFiles = options?.maxFiles ?? 12;

  const tree = await getRepoTree(owner, repo, branch, accessToken);
  const allPaths = tree.map((file) => file.path);
  const candidates = findThemeFiles(allPaths).map((candidate) => candidate.path);
  const likelyFontPaths = allPaths.filter((path) => {
    const lower = path.toLowerCase();
    return (
      /(^|\/)(app|src\/app)\/layout\.(ts|tsx|js|jsx|astro)$/.test(lower) ||
      /(^|\/)(pages|src\/pages)\/_document\.(ts|tsx|js|jsx)$/.test(lower) ||
      /(^|\/)(index|global|globals|styles|tailwind)\.(css|astro)$/.test(lower) ||
      /fonts?\.(css|astro|ts|tsx|js|jsx)$/.test(lower)
    );
  });
  const combined = Array.from(new Set([...likelyFontPaths, ...candidates])).slice(0, maxFiles);
  const selected = combined.map((path) => ({ path }));

  if (selected.length === 0) return [];

  const results: ExtractedTypography[] = [];

  for (const candidate of selected) {
    try {
      const content = await getFileContent(owner, repo, candidate.path, branch);
      const cssBlocks = extractCssBlocks(candidate.path, content);
      const cssVariableTokens = cssBlocks.flatMap((block) => parseCSSVariables(block).typography);
      const cssRuleTokens = cssBlocks.flatMap((block) => extractTypographyFromCss(block));
      const tailwindTokens = isTailwindConfig(candidate.path)
        ? parseTailwindConfig(content).typography
        : [];
      const fonts = dedupeFonts([
        ...extractGoogleFontsFromUrl(content),
        ...extractGoogleFontsFromNext(content),
        ...cssBlocks.flatMap((block) => extractGoogleFontsFromUrl(block)),
      ]);
      const fontTokens = fonts.map((font) => ({
        name: `font-${font.name.toLowerCase().replace(/\s+/g, "-")}`,
        value: font.name,
      }));
      const typography = dedupeTypography([
        ...fontTokens,
        ...cssVariableTokens,
        ...cssRuleTokens,
        ...tailwindTokens,
      ]);
      if (typography.length > 0 || fonts.length > 0) {
        results.push({ source: candidate.path, typography, fonts });
      }
    } catch {
      // Ignore per-file errors to keep parsing resilient
    }
  }

  return results;
}

function dedupeFonts(fonts: FontInfo[]) {
  const seen = new Map<string, FontInfo>();
  for (const font of fonts) {
    const key = font.name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, font);
    }
  }
  return Array.from(seen.values());
}

function dedupeTypography(tokens: Array<{ name: string; value: string; lineHeight?: string }>) {
  const seen = new Map<string, { name: string; value: string; lineHeight?: string }>();
  for (const token of tokens) {
    const key = `${token.name}:${token.value}`.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, token);
      continue;
    }
    const existing = seen.get(key);
    if (existing && !existing.lineHeight && token.lineHeight) {
      existing.lineHeight = token.lineHeight;
    }
  }
  return Array.from(seen.values());
}

function isTailwindConfig(path: string) {
  return /tailwind\.config\.(ts|js|mjs|cjs)$/i.test(path);
}

function extractTypographyFromCss(content: string) {
  const tokens: Array<{ name: string; value: string; lineHeight?: string }> = [];
  const blockRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, " ");
    const body = match[2];
    const fontSizeMatch = body.match(/font-size\s*:\s*([^;]+);/i);
    const lineHeightMatch = body.match(/line-height\s*:\s*([^;]+);/i);
    if (fontSizeMatch) {
      const size = fontSizeMatch[1].trim();
      tokens.push({
        name: `${sanitizeSelector(selector)}-font-size`,
        value: size,
        lineHeight: lineHeightMatch ? lineHeightMatch[1].trim() : undefined,
      });
    }
  }

  return tokens;
}

function sanitizeSelector(selector: string) {
  return selector
    .replace(/[:.#>+~\\[\\]="'()]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function extractCssBlocks(path: string, content: string): string[] {
  if (!path.toLowerCase().endsWith(".astro")) {
    return [content];
  }

  const blocks: string[] = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  return blocks.length > 0 ? blocks : [content];
}
