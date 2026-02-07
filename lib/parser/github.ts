import type { ParseResult } from "./types";
import { autoDetectAndParse, parseCSSVariables, parseTailwindConfig } from "./index";

type RepoInfo = {
  owner: string;
  repo: string;
};

type GithubTreeItem = {
  path: string;
  type: "blob" | "tree";
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

async function fetchDefaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!res.ok) throw new Error("Failed to fetch repo info");
  const data = await res.json();
  return data.default_branch ?? "main";
}

async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<GithubTreeItem[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  if (!res.ok) throw new Error("Failed to fetch repo tree");
  const data = await res.json();
  return (data.tree ?? []) as GithubTreeItem[];
}

async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch file ${path}`);
  return res.text();
}

function isThemeFile(path: string): boolean {
  const lower = path.toLowerCase();
  return /(theme|tokens|colors?)\.(js|ts|tsx|mjs|cjs)$/.test(lower);
}

function isTailwindConfig(path: string): boolean {
  return /tailwind\.config\.(js|ts|mjs|cjs)$/.test(path.toLowerCase());
}

function isGlobalsCss(path: string): boolean {
  return /globals\.css$/.test(path.toLowerCase());
}

function selectCandidateFiles(tree: GithubTreeItem[]): GithubTreeItem[] {
  const blobs = tree.filter((item) => item.type === "blob");
  const themes = blobs.filter((item) => isThemeFile(item.path));
  if (themes.length > 0) return themes;

  const tailwind = blobs.filter((item) => isTailwindConfig(item.path));
  if (tailwind.length > 0) return tailwind;

  const globals = blobs.filter((item) => isGlobalsCss(item.path));
  return globals;
}

export async function parseGithubThemeFiles(repoInput: string): Promise<ParseResult> {
  const info = parseRepoUrl(repoInput);
  if (!info) throw new Error("Invalid GitHub repo link");

  const branch = await fetchDefaultBranch(info.owner, info.repo);
  const tree = await fetchRepoTree(info.owner, info.repo, branch);
  const candidates = selectCandidateFiles(tree);

  if (candidates.length === 0) {
    return { colors: [], typography: [] };
  }

  const aggregate: ParseResult = { colors: [], typography: [] };

  for (const file of candidates.slice(0, 5)) {
    const content = await fetchRawFile(info.owner, info.repo, branch, file.path);
    const result =
      file.path.endsWith(".css")
        ? parseCSSVariables(content)
        : isTailwindConfig(file.path)
          ? parseTailwindConfig(content)
          : autoDetectAndParse(content);
    aggregate.colors.push(...result.colors);
    aggregate.typography.push(...result.typography);
  }

  return aggregate;
}
