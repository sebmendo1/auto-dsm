import type { ExtractedColors, ExtractedTypography, FontInfo, GitHubFile } from "./types";
import { findThemeFiles } from "./patterns";
import { parseCSSVariables } from "@/lib/parser/css-parser";
import { parseTailwindConfig } from "@/lib/parser/tailwind-parser";

const treeCache = new Map<string, GitHubFile[]>();
const contentCache = new Map<string, string>();
const repoInfoCache = new Map<string, { default_branch: string }>();

const DEFAULT_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 600;

const FALLBACK_CSS_PATHS = [
  "app/globals.css",
  "src/app/globals.css",
  "styles/globals.css",
  "src/styles/globals.css",
  "globals.css",
  "app.css",
  "src/index.css",
  "src/styles/index.css",
  "styles/index.css",
  "tailwind.css",
  "src/styles/tailwind.css",
  "styles/tailwind.css",
];

const FALLBACK_TYPO_PATHS = [
  "app/layout.tsx",
  "app/layout.jsx",
  "src/app/layout.tsx",
  "src/app/layout.jsx",
  "pages/_document.tsx",
  "pages/_document.jsx",
  "src/pages/_document.tsx",
  "src/pages/_document.jsx",
  "styles/globals.css",
  "src/styles/globals.css",
  "globals.css",
  "app.css",
  "src/index.css",
  "src/styles/index.css",
  "styles/index.css",
  "fonts.css",
];

function parseRepoFullName(repoFullName: string): { owner: string; repo: string } {
  const trimmed = repoFullName.trim().replace(/\.git$/, "");
  if (!trimmed) throw new Error("Repo must be in owner/repo format");

  if (trimmed.includes("github.com")) {
    const match = trimmed.match(/github\.com\/([^/]+)\/([^/#?]+)(?:$|\/|#|\?)/i);
    if (!match) throw new Error("Repo must be in owner/repo format");
    return { owner: match[1], repo: match[2] };
  }

  const parts = trimmed.split("/").filter(Boolean);
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
  const cacheKey = `${owner}/${repo}`;
  const cached = repoInfoCache.get(cacheKey);
  if (cached) return cached.default_branch ?? "main";

  const res = await fetchWithRetry(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: createHeaders(accessToken) },
    DEFAULT_RETRY_ATTEMPTS,
  );
  if (!res.ok) throw new Error("Failed to fetch repo info");
  const data = await res.json();
  repoInfoCache.set(cacheKey, data);
  return data.default_branch ?? "main";
}

async function getRepoTree(
  owner: string,
  repo: string,
  branch: string,
  accessToken?: string,
): Promise<GitHubFile[]> {
  const cacheKey = `${owner}/${repo}@${branch}`;
  const cached = treeCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetchWithRetry(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: createHeaders(accessToken) },
    DEFAULT_RETRY_ATTEMPTS,
  );
  if (!res.ok) {
    if (res.status === 404 && branch !== "master") {
      return getRepoTree(owner, repo, "master", accessToken);
    }
    throw new Error("Failed to fetch repo tree");
  }
  const data = await res.json();
  const tree = (data.tree ?? [])
    .filter((item: any) => item.type === "blob" && item.path)
    .map((item: any) => ({
      path: item.path as string,
      name: (item.path as string).split("/").pop() ?? item.path,
      type: "file" as const,
      sha: item.sha as string,
      size: item.size ?? 0,
      url: item.url as string,
    }));
  treeCache.set(cacheKey, tree);
  return tree;
}

async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<string> {
  const cacheKey = `${owner}/${repo}@${branch}:${path}`;
  const cached = contentCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetchWithRetry(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
    undefined,
    DEFAULT_RETRY_ATTEMPTS,
  );
  if (!res.ok) throw new Error(`Unable to fetch ${path}`);
  const text = await res.text();
  contentCache.set(cacheKey, text);
  return text;
}

async function resolveBranch(owner: string, repo: string, accessToken?: string) {
  try {
    return await getDefaultBranch(owner, repo, accessToken);
  } catch {
    return "main";
  }
}

async function fetchCandidateFiles(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
): Promise<Array<{ path: string; content: string }>> {
  const branches = Array.from(new Set([branch, "main", "master"]));
  const results: Array<{ path: string; content: string }> = [];

  for (const candidate of paths) {
    let fetched = false;
    for (const candidateBranch of branches) {
      try {
        const content = await getFileContent(owner, repo, candidate, candidateBranch);
        results.push({ path: candidate, content });
        fetched = true;
        break;
      } catch {
        // try next branch
      }
    }
    if (!fetched) continue;
  }

  return results;
}

export async function extractColorsFromRepo(
  repoFullName: string,
  accessToken?: string,
  options?: { branch?: string; maxFiles?: number },
): Promise<ExtractedColors[]> {
  const { owner, repo } = parseRepoFullName(repoFullName);
  const branch = options?.branch ?? (await resolveBranch(owner, repo, accessToken));
  const maxFiles = options?.maxFiles ?? 5;

  let tree: GitHubFile[] = [];
  try {
    tree = await getRepoTree(owner, repo, branch, accessToken);
  } catch {
    const fallbackFiles = await fetchCandidateFiles(owner, repo, branch, FALLBACK_CSS_PATHS);
    const colors = dedupeColors(
      fallbackFiles.flatMap((file) =>
        extractCssBlocks(file.path, file.content).flatMap((block) => [
          ...parseCSSVariables(block).colors,
          ...extractColorsFromCssRules(block),
        ]),
      ),
    );
    return colors.length > 0 ? [{ source: "fallback", colors }] : [];
  }

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
      const colors = dedupeColors(
        cssBlocks.flatMap((block) => [
          ...parseCSSVariables(block).colors,
          ...extractColorsFromCssRules(block),
        ]),
      );
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
  const branch = options?.branch ?? (await resolveBranch(owner, repo, accessToken));
  const maxFiles = options?.maxFiles ?? 12;

  let tree: GitHubFile[] = [];
  try {
    tree = await getRepoTree(owner, repo, branch, accessToken);
  } catch {
    const fallbackFiles = await fetchCandidateFiles(owner, repo, branch, FALLBACK_TYPO_PATHS);
    if (fallbackFiles.length === 0) return [];
    const results: ExtractedTypography[] = [];
    for (const file of fallbackFiles) {
      const cssBlocks = extractCssBlocks(file.path, file.content);
      const cssVariableTokens = cssBlocks.flatMap((block) => parseCSSVariables(block).typography);
      const cssRuleTokens = cssBlocks.flatMap((block) => extractTypographyFromCss(block));
      const fonts = dedupeFonts([
        ...extractGoogleFontsFromUrl(file.content),
        ...extractGoogleFontsFromNext(file.content),
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
      ]);
      if (typography.length > 0 || fonts.length > 0) {
        results.push({ source: file.path, typography, fonts });
      }
    }
    return results;
  }

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
    if (selector.startsWith("@")) continue;
    if (selector.includes("@media") || selector.includes("@layer")) continue;
    const fontSizeMatch = body.match(/font-size\s*:\s*([^;]+);/i);
    const lineHeightMatch = body.match(/line-height\s*:\s*([^;]+);/i);
    const fontFamilyMatch = body.match(/font-family\s*:\s*([^;]+);/i);
    if (fontSizeMatch) {
      const size = fontSizeMatch[1].trim();
      tokens.push({
        name: `${sanitizeSelector(selector)}-font-size`,
        value: size,
        lineHeight: lineHeightMatch ? lineHeightMatch[1].trim() : undefined,
      });
    }
    if (fontFamilyMatch) {
      tokens.push({
        name: `${sanitizeSelector(selector)}-font-family`,
        value: fontFamilyMatch[1].trim(),
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

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  attempts = DEFAULT_RETRY_ATTEMPTS,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (!shouldRetry(res.status) || attempt === attempts) return res;

      const retryAfter = res.headers.get("retry-after");
      const delayMs = retryAfter ? Number(retryAfter) * 1000 : backoffDelay(attempt);
      await sleep(delayMs);
      continue;
    } catch (error) {
      lastError = error as Error;
      if (attempt === attempts) break;
      await sleep(backoffDelay(attempt));
    }
  }

  if (lastError) throw lastError;
  return fetch(url, init);
}

function shouldRetry(status: number) {
  return status === 403 || status === 429 || status >= 500;
}

function backoffDelay(attempt: number) {
  const jitter = Math.random() * 200;
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + jitter;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractColorsFromCssRules(content: string) {
  const colors: Array<{ name: string; value: string; category: string | null }> = [];
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(content)) !== null) {
    const selector = match[1].trim();
    const body = match[2];
    if (selector.startsWith("@")) continue;

    const declarations = body.split(";");
    for (const declaration of declarations) {
      const [rawProp, rawValue] = declaration.split(":");
      if (!rawProp || !rawValue) continue;
      const prop = rawProp.trim().toLowerCase();
      const value = rawValue.trim();
      if (!isColorProperty(prop)) continue;
      if (!isColorValue(value)) continue;
      colors.push({
        name: `${sanitizeSelector(selector)}-${prop}`,
        value: normalizeColorValue(value),
        category: inferColorCategory(prop),
      });
    }
  }

  return colors;
}

function isColorProperty(prop: string) {
  return (
    prop.includes("color") ||
    prop.includes("background") ||
    prop.includes("border") ||
    prop.includes("fill") ||
    prop.includes("stroke")
  );
}

function isColorValue(value: string) {
  const v = value.trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
  if (/^(rgb|hsl|oklch|oklab|lab|lch)\s*\(/.test(v)) return true;
  if (/^\d+\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/.test(v)) return true;
  return false;
}

function normalizeColorValue(value: string) {
  if (/^\d+\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%/.test(value)) {
    return `hsl(${value})`;
  }
  return value;
}

function inferColorCategory(name: string) {
  if (name.includes("background")) return "background";
  if (name.includes("border")) return "border";
  if (name.includes("text")) return "text";
  if (name.includes("fill")) return "fill";
  return null;
}

function dedupeColors(
  colors: Array<{ name: string; value: string; category: string | null }>,
) {
  const seen = new Map<string, { name: string; value: string; category: string | null }>();
  for (const color of colors) {
    const key = `${color.name}:${color.value}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, color);
  }
  return Array.from(seen.values());
}
