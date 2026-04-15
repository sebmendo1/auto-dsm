import type { TsPathsConfig } from "@/lib/github/tsconfig-paths";
import {
  posixDirname,
  resolveSpecifierToRepoBasePath,
} from "@/lib/github/module-specifier-resolve";

function stripExtension(p: string): string {
  return p.replace(/\.(tsx?|jsx?|mjs|cjs|css|scss)$/i, "");
}

/**
 * Relative import path from `fromRepoPath` to `toRepoPath` (repo-relative).
 */
export function relativeSpecifierBetweenRepoFiles(fromRepoPath: string, toRepoPath: string): string {
  const fromDir = posixDirname(fromRepoPath);
  const fromParts = fromDir ? fromDir.split("/").filter(Boolean) : [];
  const toParts = stripExtension(toRepoPath).split("/").filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i += 1;
  }
  const up = fromParts.length - i;
  const down = toParts.slice(i);
  const prefix = up === 0 ? "./" : "../".repeat(up);
  const tail = down.join("/");
  if (!tail) return prefix === "./" ? "./" : `${prefix}.`;
  return `${prefix}${tail}`;
}

function findGraphFileForBase(base: string, graphPaths: Set<string>): string | null {
  if (graphPaths.has(base)) return base;
  const exts = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".css", ".scss"];
  for (const ext of exts) {
    const p = `${base}${ext}`;
    if (graphPaths.has(p)) return p;
  }
  for (const p of graphPaths) {
    if (stripExtension(p) === base) return p;
  }
  return null;
}

function tryRewriteSpecifier(
  importerRepoPath: string,
  spec: string,
  graphPaths: Set<string>,
  pathCtx: TsPathsConfig | null,
): string | null {
  const resolved = resolveSpecifierToRepoBasePath(importerRepoPath, spec, pathCtx);
  if (resolved === null) return null;
  const target = findGraphFileForBase(resolved, graphPaths);
  if (!target) return null;
  return relativeSpecifierBetweenRepoFiles(importerRepoPath, target);
}

/**
 * Rewrite local module specifiers in source to relative paths resolvable inside Sandpack `/src/r/...`.
 * Leaves npm package specifiers unchanged.
 */
export function rewriteRepoSourceForSandpack(
  importerRepoPath: string,
  source: string,
  graphRepoPaths: Set<string>,
  pathCtx: TsPathsConfig | null,
): string {
  const apply = (spec: string): string => tryRewriteSpecifier(importerRepoPath, spec, graphRepoPaths, pathCtx) ?? spec;

  let out = source;

  out = out.replace(
    /(\bfrom\s+)(["'])([^"']+)\2/g,
    (full, kw: string, q: string, spec: string) => {
      const n = apply(spec);
      return n === spec ? full : `${kw}${q}${n}${q}`;
    },
  );

  out = out.replace(/import\s*\(\s*(["'])([^"']+)\1\s*\)/g, (full, q: string, spec: string) => {
    const n = apply(spec);
    return n === spec ? full : `import(${q}${n}${q})`;
  });

  out = out.replace(
    /(\bimport\s+)(["'])([^"']+)\2(\s*;)/g,
    (full, lead: string, q: string, spec: string, tail: string) => {
      const n = apply(spec);
      return n === spec ? full : `${lead}${q}${n}${q}${tail}`;
    },
  );

  out = out.replace(
    /(\bexport\s+[^'"]*?\s+from\s+)(["'])([^"']+)\2/g,
    (full, kw: string, q: string, spec: string) => {
      const n = apply(spec);
      return n === spec ? full : `${kw}${q}${n}${q}`;
    },
  );

  return out;
}
