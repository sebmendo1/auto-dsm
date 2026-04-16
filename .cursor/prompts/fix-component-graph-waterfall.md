---
description: Fix the sequential GitHub API waterfall in fetchComponentWorkbenchGraph that causes component loading to hang before Sandpack ever starts
---

# Fix: Component graph loading waterfall in `fetchComponentWorkbenchGraph`

## Problem

When a user navigates to `/dashboard/components/:slug`, the page gets stuck on the skeleton loader and never reaches Sandpack. The bottleneck is `src/lib/github/fetch-component-graph.ts` — specifically the `fetchComponentWorkbenchGraph` function.

### Why it's slow

The function builds a virtual file graph by crawling a component's dependency tree. It does this by making **sequential** GitHub API calls — one per file, one per extension probe — with zero parallelism and no use of the repo tree index.

The worst offender is `resolveAndFetchFromRepoBasePath` (line 95). For every import like `./utils`, it tries up to 10 extension candidates **one at a time**:

```
./utils.tsx  → 404  (API call)
./utils.ts   → 404  (API call)
./utils.jsx  → 404  (API call)
./utils.js   → 200  (API call — finally found)
```

A component with 20 imports can trigger 200 sequential HTTP round-trips before the API responds. Each takes 100-500ms. Total: 10-60+ seconds of blocking.

### What already exists that should be used

`src/lib/github/repo-path-index.ts` exports `getRepoPathIndex()` — it fetches the **entire repo tree in a single API call** and returns a `RepoPathIndex` with a `paths: string[]` array of every file in the repo. It has built-in TTL caching keyed by commit SHA. It's already used by the `discover-components` and `repo-assets` endpoints but `fetchComponentWorkbenchGraph` ignores it entirely.

## What to change

Refactor `fetchComponentWorkbenchGraph` in `src/lib/github/fetch-component-graph.ts` to:

### 1. Load the tree index up front

At the start of the function, call `getRepoPathIndex()` once. Build a `Set<string>` from `index.paths` for O(1) lookups.

```ts
const index = await getRepoPathIndex(octokit, owner, repo, ref);
const treePathSet = new Set(index.paths);
```

### 2. Replace `resolveAndFetchFromRepoBasePath` with tree-based resolution

Instead of probing extensions via HTTP 404s, check the `treePathSet`:

```ts
function resolveFromTree(repoBasePath: string, treePathSet: Set<string>): string | null {
  const normalized = normalizeRepoPath(repoBasePath);
  for (const candidate of extensionCandidates(normalized)) {
    if (treePathSet.has(candidate)) return candidate;
  }
  return null;
}
```

This replaces up to 10 HTTP calls per import with 10 Set lookups (microseconds).

### 3. Parallelize file content fetches

The current while-loop fetches files one at a time. Instead, collect all resolved paths first (using the tree), then batch-fetch contents in parallel:

- Walk the dependency tree using **only** the tree index + source already in memory for import extraction
- Collect the full list of repo paths needed
- Fetch all file contents in parallel with `Promise.all` (or in batches of ~10-15 to avoid rate limits)

For fetching file content, use `raw.githubusercontent.com` GETs instead of `octokit.rest.repos.getContent` — they're faster (no base64 decode, no JSON wrapper) and don't count against the REST API rate limit. Example:

```ts
async function fetchRawFile(owner: string, repo: string, ref: string, path: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}
```

### 4. Parallelize tsconfig + global CSS loading

`loadSandpackPathContext` fetches `tsconfig.json` then `tsconfig.app.json` sequentially. Fetch both in parallel:

```ts
const [rootRaw, appRaw] = await Promise.all([
  fetchRawFile(owner, repo, ref, "tsconfig.json"),
  fetchRawFile(owner, repo, ref, "tsconfig.app.json"),
]);
```

For global CSS candidates (line 211-221), check the tree index instead of probing:

```ts
for (const g of GLOBAL_CSS_CANDIDATES) {
  if (treePathSet.has(g)) {
    pathsToFetch.push(g);
    globalCssRepoPaths.push(g);
  }
}
```

### 5. Two-phase graph resolution

The new algorithm should be:

**Phase 1 — Resolve the full dependency graph (tree only, no fetches):**

```
queue = [entryFilePath]
resolvedPaths = Set<string>

while queue is not empty:
    path = queue.shift()
    if already in resolvedPaths: skip
    resolvedPaths.add(path)

    // We need the source to find imports — if not yet fetched, mark for fetch
    source = alreadyFetched[path] || await fetchRawFile(...)
    
    for each local import specifier in source:
        basePath = resolveSpecifierToRepoBasePath(...)
        resolvedPath = resolveFromTree(basePath, treePathSet)
        if resolvedPath and not in resolvedPaths:
            queue.push(resolvedPath)
```

Note: Phase 1 still needs to fetch files to parse their imports. The optimization is that **extension resolution** uses the tree (instant) instead of HTTP probing. File content fetching is still sequential in the crawl since each file's imports determine what to fetch next. But each file now costs exactly 1 fetch instead of up to 10.

**Phase 2 — Re-fetch anything missing in parallel (if needed):**

Any global CSS or extra paths not yet fetched can be batched.

## Files to modify

- `src/lib/github/fetch-component-graph.ts` — main refactor target
- No other files need changes; the function signature and return type stay the same

## Files to reference (read-only)

- `src/lib/github/repo-path-index.ts` — `getRepoPathIndex()` and `RepoPathIndex` type
- `src/lib/github/module-specifier-resolve.ts` — `extractLocalModuleSpecifiers`, `resolveSpecifierToRepoBasePath`, `normalizeRepoPath`
- `src/lib/github/tsconfig-paths.ts` — `TsPathsConfig`, `parseTsconfigCompilerOptions`, `mergePathsConfig`
- `src/lib/github/component-fetcher.ts` — `extractDependenciesFromSource`, `resolveComponentExportName`, `detectHasDefaultExport`
- `server/index.ts` — the `/api/components/:slug` endpoint that calls this function

## Constraints

- Do NOT change the return type `ComponentWorkbenchGraph` — it's consumed by the frontend as-is
- Do NOT change the function signature of `fetchComponentWorkbenchGraph` — the server endpoint depends on it
- Keep the `maxGraphFiles()` limit (default 96) — it prevents runaway crawls
- Keep cycle protection (`seenQueued` set) — import cycles are common in real repos
- The `getRepoPathIndex` cache has a 3-minute TTL, so repeated navigations within the same repo will be fast

## How to verify

1. Run `npm run dev` to start both Vite and Express
2. Navigate to the dashboard, connect a real public repo (e.g. `shadcn-ui/ui`)
3. Wait for component discovery to complete in the sidebar
4. Click any component — it should load in under 5 seconds instead of 30-60+
5. Check the Express terminal — you should see far fewer GitHub API calls logged
6. Test with a repo that has tsconfig path aliases (e.g. `@/lib/utils`) to confirm alias resolution still works
