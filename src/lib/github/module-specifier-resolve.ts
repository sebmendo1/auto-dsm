import type { TsPathsConfig } from "./tsconfig-paths";
import { resolveNonRelativeSpecifierToRepoPath } from "./tsconfig-paths";

/** Same as fetch-component-graph: normalize `a/../b`. */
export function normalizeRepoPath(p: string): string {
  const parts = p.split("/").filter((s) => s && s !== ".");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

export function posixDirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i <= 0 ? "" : p.slice(0, i);
}

export function posixJoin(a: string, b: string): string {
  if (!a) return normalizeRepoPath(b);
  if (!b) return normalizeRepoPath(a);
  return normalizeRepoPath(`${a.replace(/\/+$/, "")}/${b.replace(/^\/+/, "")}`);
}

export function resolveRelativeRepoImport(importerRepoPath: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const dir = posixDirname(importerRepoPath);
  const combined = dir ? `${dir}/${specifier}` : specifier;
  return normalizeRepoPath(combined);
}

function collectQuotedSpecifiers(source: string): string[] {
  const out: string[] = [];
  const patterns = [
    /import\s+[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /export\s+[^'"]*?\s+from\s+["']([^"']+)["']/g,
    /import\s+["']([^"']+)["']\s*;/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      if (m[1]) out.push(m[1]);
    }
  }
  return out;
}

export function extractPathMappedSpecifiers(source: string, pathKeys: string[]): string[] {
  if (pathKeys.length === 0) return [];
  const keysSorted = [...pathKeys].sort((a, b) => b.length - a.length);
  const set = new Set<string>();
  for (const s of collectQuotedSpecifiers(source)) {
    if (s.startsWith(".") || s.startsWith("~/") || s.startsWith("@/")) continue;
    for (const pk of keysSorted) {
      const star = pk.indexOf("*");
      const prefix = star >= 0 ? pk.slice(0, star) : pk;
      if (!prefix) continue;
      if (s === pk.replace(/\*/g, "") || s.startsWith(prefix)) {
        set.add(s);
        break;
      }
    }
  }
  return [...set];
}

/** Relative imports, `~/`, `@/`, dynamic/static `import()`, and specifiers matching tsconfig `paths` keys. */
export function extractLocalModuleSpecifiers(source: string, tsPathKeys: string[] = []): string[] {
  const set = new Set<string>();
  for (const s of collectQuotedSpecifiers(source)) {
    if (s.startsWith(".")) set.add(s);
    else if (s.startsWith("~/")) set.add(s);
    else if (s.startsWith("@/")) set.add(s);
  }
  for (const s of extractPathMappedSpecifiers(source, tsPathKeys)) {
    set.add(s);
  }
  return [...set];
}

/**
 * Resolve a module specifier to a repo-root-relative **base path** (no extension), or null if npm / unknown.
 */
export function resolveSpecifierToRepoBasePath(
  importerRepoPath: string,
  specifier: string,
  pathCtx: TsPathsConfig | null,
): string | null {
  const rel = resolveRelativeRepoImport(importerRepoPath, specifier);
  if (rel) return rel;

  if (specifier.startsWith("~/")) {
    if (pathCtx) {
      return resolveNonRelativeSpecifierToRepoPath(specifier, pathCtx);
    }
    const rest = specifier.slice(2).replace(/^\/+/, "");
    return normalizeRepoPath(posixJoin("src", rest));
  }

  if (pathCtx && Object.keys(pathCtx.paths).length > 0) {
    const mapped = resolveNonRelativeSpecifierToRepoPath(specifier, pathCtx);
    if (mapped) return mapped;
  }

  // Fallback when no tsconfig paths: `@/*` → `src/*` (common Next / shadcn layout)
  if (specifier.startsWith("@/")) {
    return normalizeRepoPath(posixJoin("src", specifier.slice(2)));
  }

  return null;
}
