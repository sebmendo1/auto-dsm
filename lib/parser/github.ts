import type { ParseResult } from "./types";
import { extractColorsFromRepo, extractTypographyFromRepo } from "@/lib/github/fetcher";

type RepoInfo = {
  owner: string;
  repo: string;
};

export function parseRepoUrl(input: string): RepoInfo | null {
  const trimmed = input.trim().replace(/\/$/, "");
  if (!trimmed) return null;

  if (trimmed.includes("github.com")) {
    const match = trimmed.match(/github\.com\/(.+?)\/(.+?)(?:$|\/|#|\?)/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  }

  if (trimmed.includes("/")) {
    const [owner, repo] = trimmed.split("/");
    if (owner && repo) return { owner, repo };
  }

  return null;
}

export async function parseGithubThemeFiles(repoInput: string): Promise<ParseResult> {
  const info = parseRepoUrl(repoInput);
  if (!info) throw new Error("Invalid GitHub repo link");
  const repoFullName = `${info.owner}/${info.repo}`;

  const colorResults = await extractColorsFromRepo(repoFullName);
  const typographyResults = await extractTypographyFromRepo(repoFullName);

  const colors = dedupeColors(colorResults.flatMap((entry) => entry.colors));
  const typography = dedupeTypography(
    typographyResults.flatMap((entry) => entry.typography),
  );

  return { colors, typography };
}

function dedupeColors(colors: Array<{ name: string; value: string; category: string | null }>) {
  const seen = new Map<string, { name: string; value: string; category: string | null }>();
  for (const color of colors) {
    const key = `${color.name}:${color.value}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, color);
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
