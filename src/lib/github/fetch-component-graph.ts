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
import { getRepoPathIndex } from "./repo-path-index";

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

/** Resolve an import base path to an actual file using the tree index (zero HTTP calls). */
function resolveFromPathSet(basePath: string, pathSet: Set<string>): string | null {
  const normalized = normalizeRepoPath(basePath);
  for (const candidate of extensionCandidates(normalized)) {
    if (pathSet.has(candidate)) return candidate;
  }
  return null;
}

/** Fetch a file from raw.githubusercontent.com (does not count against REST API rate limit). */
async function fetchRawFile(
  owner: string,
  repo: string,
  ref: string,
  path: string,
): Promise<string | null> {
  try {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${encodedPath}`;
    const res = await fetch(url);
    return res.ok ? res.text() : null;
  } catch {
    return null;
  }
}

/** Fetch multiple files in parallel, in batches to avoid overwhelming the network. */
async function batchFetchRawFiles(
  owner: string,
  repo: string,
  ref: string,
  paths: string[],
  batchSize = 15,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(async (p) => {
        const content = await fetchRawFile(owner, repo, ref, p);
        return { path: p, content };
      }),
    );
    for (const { path, content } of fetched) {
      if (content) results[path] = content;
    }
  }
  return results;
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

  // 1. Fetch tree index (single API call, cached by commit SHA for 3 min)
  const index = await getRepoPathIndex(octokit, owner, repo, options?.branch);
  const ref = index.commitSha;
  const pathSet = new Set(index.paths);

  // 2. Load tsconfig path aliases in parallel (check tree first to avoid 404s)
  const tsconfigPaths = ["tsconfig.json", "tsconfig.app.json"].filter((p) => pathSet.has(p));
  const tsconfigContents = await batchFetchRawFiles(owner, repo, ref, tsconfigPaths);

  let pathCtx: TsPathsConfig | null = null;
  for (const configPath of tsconfigPaths) {
    const raw = tsconfigContents[configPath];
    if (!raw) continue;
    const parsed = parseTsconfigCompilerOptions(raw);
    if (parsed) {
      pathCtx = mergePathsConfig(pathCtx, { baseUrl: parsed.baseUrl, paths: parsed.paths }, "");
    }
  }

  const keys = tsPathKeys(pathCtx);
  const limit = maxGraphFiles();

  // 3. BFS: resolve the dependency graph using tree-based extension resolution
  //    Each file still needs to be fetched to parse its imports, but extension
  //    resolution is instant (Set lookup) instead of 10 HTTP probes per import.
  const virtualRepoFiles: Record<string, string> = {};
  const queue: string[] = [entryFilePath, ...(options?.extraRepoPaths ?? [])];
  const seenQueued = new Set<string>();

  while (queue.length > 0 && Object.keys(virtualRepoFiles).length < limit) {
    // Collect the next batch of unvisited paths to fetch in parallel
    const toFetch: string[] = [];
    while (queue.length > 0 && toFetch.length < 15 && (Object.keys(virtualRepoFiles).length + toFetch.length) < limit) {
      const next = queue.shift();
      if (!next || seenQueued.has(next)) continue;
      seenQueued.add(next);
      if (pathSet.has(next)) {
        toFetch.push(next);
      }
    }

    if (toFetch.length === 0) break;

    // Batch-fetch this round of files
    const fetched = await batchFetchRawFiles(owner, repo, ref, toFetch);

    for (const [filePath, content] of Object.entries(fetched)) {
      virtualRepoFiles[filePath] = content;

      // Only parse imports from code files (not CSS)
      if (!TEXT_EXT.test(filePath) || filePath.endsWith(".css") || filePath.endsWith(".scss")) continue;

      for (const spec of extractLocalModuleSpecifiers(content, keys)) {
        const basePath = resolveSpecifierToRepoBasePath(filePath, spec, pathCtx);
        if (!basePath) continue;

        // Resolve via tree Set — zero HTTP calls
        const resolvedPath = resolveFromPathSet(basePath, pathSet);
        if (resolvedPath && !seenQueued.has(resolvedPath) && !virtualRepoFiles[resolvedPath]) {
          queue.push(resolvedPath);
        }
      }
    }
  }

  const entrySource = virtualRepoFiles[entryFilePath];
  if (!entrySource) {
    throw new Error(`Cannot read component file: ${entryFilePath}`);
  }

  // 4. Global CSS: check tree index, then batch-fetch only existing files
  const globalCssRepoPaths: string[] = [];
  const globalCssToFetch: string[] = [];
  for (const g of GLOBAL_CSS_CANDIDATES) {
    if (virtualRepoFiles[g]) {
      globalCssRepoPaths.push(g);
    } else if (pathSet.has(g)) {
      globalCssToFetch.push(g);
    }
  }
  if (globalCssToFetch.length > 0) {
    const cssContents = await batchFetchRawFiles(owner, repo, ref, globalCssToFetch);
    for (const g of globalCssToFetch) {
      if (cssContents[g]) {
        virtualRepoFiles[g] = cssContents[g];
        globalCssRepoPaths.push(g);
      }
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
