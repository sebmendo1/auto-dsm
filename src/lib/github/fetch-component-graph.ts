import { Octokit } from "octokit";
import {
  detectHasDefaultExport,
  extractDependenciesFromSource,
  resolveComponentExportName,
} from "./component-fetcher";
import {
  extractLocalModuleSpecifiers,
  normalizeRepoPath,
  resolveSpecifierToRepoBasePath,
} from "./module-specifier-resolve";
import {
  mergePathsConfig,
  parseTsconfigCompilerOptions,
  pathAliasPrefixesFromPaths,
  type TsPathsConfig,
} from "./tsconfig-paths";

function maxGraphFiles(): number {
  const raw = typeof process !== "undefined" ? process.env.COMPONENT_GRAPH_MAX_FILES : undefined;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return Math.min(n, 500);
  }
  return 96;
}

const TEXT_EXT = /\.(tsx?|jsx?|mjs|cjs|css|scss)$/i;

const GLOBAL_CSS_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "styles/globals.css",
  "src/styles/globals.css",
  "app/global.css",
  "src/global.css",
] as const;

export type ComponentWorkbenchGraph = {
  name: string;
  filePath: string;
  source: string;
  dependencies: string[];
  hasDefaultExport: boolean;
  exportName: string;
  /** Full repo-relative paths → file contents, for Sandpack `/src/r/...` mirroring. */
  virtualRepoFiles: Record<string, string>;
  /** Repo paths of optional globals merged into Sandpack (first → last). */
  globalCssRepoPaths: string[];
  /** True if any fetched CSS contains @tailwind (enable Tailwind in Sandpack). */
  useTailwindInPreview: boolean;
  /** When present, client rewrites path aliases to relative imports for Sandpack. */
  sandpackPathContext?: TsPathsConfig;
};

function extensionCandidates(resolvedBase: string): string[] {
  if (TEXT_EXT.test(resolvedBase)) return [resolvedBase];
  return [
    `${resolvedBase}.tsx`,
    `${resolvedBase}.ts`,
    `${resolvedBase}.jsx`,
    `${resolvedBase}.js`,
    `${resolvedBase}.mjs`,
    `${resolvedBase}.cjs`,
    `${resolvedBase}.css`,
    `${resolvedBase}.scss`,
    `${resolvedBase}/index.tsx`,
    `${resolvedBase}/index.ts`,
    `${resolvedBase}/index.jsx`,
    `${resolvedBase}/index.js`,
  ];
}

async function fetchRepoTextFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  path: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    if (!("content" in data) || data.encoding !== "base64") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

async function resolveAndFetchFromRepoBasePath(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  repoBasePath: string,
): Promise<{ path: string; content: string } | null> {
  const normalized = normalizeRepoPath(repoBasePath);
  for (const candidate of extensionCandidates(normalized)) {
    const content = await fetchRepoTextFile(octokit, owner, repo, ref, candidate);
    if (content) return { path: candidate, content };
  }
  return null;
}

function mergeDepsFromFiles(
  files: Record<string, string>,
  pathCtx: TsPathsConfig | null,
): string[] {
  const prefixes = pathCtx ? pathAliasPrefixesFromPaths(pathCtx.paths) : [];
  const all = new Set<string>();
  for (const src of Object.values(files)) {
    for (const d of extractDependenciesFromSource(src, { pathAliasPrefixes: prefixes })) {
      all.add(d);
    }
  }
  return [...all];
}

function detectTailwind(cssContents: string[]): boolean {
  return cssContents.some((c) => /@tailwind\b/.test(c));
}

async function loadSandpackPathContext(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
): Promise<TsPathsConfig | null> {
  let ctx: TsPathsConfig | null = null;

  const rootRaw = await fetchRepoTextFile(octokit, owner, repo, ref, "tsconfig.json");
  if (rootRaw) {
    const parsed = parseTsconfigCompilerOptions(rootRaw);
    if (parsed) {
      ctx = mergePathsConfig(ctx, { baseUrl: parsed.baseUrl, paths: parsed.paths }, "");
    }
  }

  const appRaw = await fetchRepoTextFile(octokit, owner, repo, ref, "tsconfig.app.json");
  if (appRaw) {
    const parsed = parseTsconfigCompilerOptions(appRaw);
    if (parsed) {
      ctx = mergePathsConfig(ctx, { baseUrl: parsed.baseUrl, paths: parsed.paths }, "");
    }
  }

  return ctx;
}

function tsPathKeys(ctx: TsPathsConfig | null): string[] {
  return ctx ? Object.keys(ctx.paths) : [];
}

export async function fetchComponentWorkbenchGraph(
  owner: string,
  repo: string,
  entryFilePath: string,
  accessToken: string | undefined,
  options?: { branch?: string; extraRepoPaths?: string[] },
): Promise<ComponentWorkbenchGraph> {
  const octokit = new Octokit(accessToken ? { auth: accessToken } : {});

  let ref = options?.branch;
  if (!ref) {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    ref = repoData.default_branch;
  }

  const pathCtx = await loadSandpackPathContext(octokit, owner, repo, ref);
  const keys = tsPathKeys(pathCtx);
  const limit = maxGraphFiles();

  const virtualRepoFiles: Record<string, string> = {};
  const queue: string[] = [entryFilePath, ...(options?.extraRepoPaths ?? [])];
  const seenQueued = new Set<string>();

  while (queue.length > 0 && Object.keys(virtualRepoFiles).length < limit) {
    const next = queue.shift();
    if (!next || seenQueued.has(next)) continue;
    seenQueued.add(next);

    const content = await fetchRepoTextFile(octokit, owner, repo, ref, next);
    if (!content) continue;
    virtualRepoFiles[next] = content;

    if (!TEXT_EXT.test(next) || next.endsWith(".css") || next.endsWith(".scss")) continue;

    for (const spec of extractLocalModuleSpecifiers(content, keys)) {
      const basePath = resolveSpecifierToRepoBasePath(next, spec, pathCtx);
      if (!basePath) continue;

      const resolved = await resolveAndFetchFromRepoBasePath(octokit, owner, repo, ref, basePath);
      if (!resolved) continue;
      if (!virtualRepoFiles[resolved.path] && Object.keys(virtualRepoFiles).length < limit) {
        queue.push(resolved.path);
      }
    }
  }

  const entrySource = virtualRepoFiles[entryFilePath];
  if (!entrySource) {
    throw new Error(`Cannot read component file: ${entryFilePath}`);
  }

  const globalCssRepoPaths: string[] = [];
  for (const g of GLOBAL_CSS_CANDIDATES) {
    if (virtualRepoFiles[g]) {
      globalCssRepoPaths.push(g);
      continue;
    }
    const gContent = await fetchRepoTextFile(octokit, owner, repo, ref, g);
    if (gContent) {
      virtualRepoFiles[g] = gContent;
      globalCssRepoPaths.push(g);
    }
  }

  const cssBodies = Object.entries(virtualRepoFiles)
    .filter(([p]) => p.endsWith(".css") || p.endsWith(".scss"))
    .map(([, c]) => c);
  const useTailwindInPreview = detectTailwind(cssBodies);

  const dependencies = mergeDepsFromFiles(virtualRepoFiles, pathCtx);
  const name = resolveComponentExportName(entrySource, entryFilePath);
  const hasDefaultExport = detectHasDefaultExport(entrySource);

  return {
    name,
    filePath: entryFilePath,
    source: entrySource,
    dependencies,
    hasDefaultExport,
    exportName: name,
    virtualRepoFiles,
    globalCssRepoPaths,
    useTailwindInPreview,
    sandpackPathContext: pathCtx ?? undefined,
  };
}
