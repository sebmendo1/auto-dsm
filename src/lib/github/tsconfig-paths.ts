/** Minimal TS `compilerOptions.paths` + `baseUrl` handling for Sandpack graph + import rewrite. */

export type TsPathsConfig = {
  /** Normalized repo-relative directory (e.g. `""` or `"packages/app"`) where `baseUrl` applies. */
  configDir: string;
  /** `compilerOptions.baseUrl` relative to repo root (often `"."`). */
  baseUrl: string;
  /** `compilerOptions.paths` */
  paths: Record<string, string[]>;
};

function normalizeRepoPath(p: string): string {
  const parts = p.split("/").filter((s) => s && s !== ".");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function posixJoin(a: string, b: string): string {
  if (!a) return normalizeRepoPath(b);
  if (!b) return normalizeRepoPath(a);
  return normalizeRepoPath(`${a.replace(/\/+$/, "")}/${b.replace(/^\/+/, "")}`);
}

/** Escape for regex; `*` becomes a non-greedy capture (one per `*` in the pattern). */
function pathPatternToRegex(pattern: string): RegExp {
  if (!pattern.includes("*")) {
    return new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&")}$`);
  }
  const parts = pattern.split("*");
  if (parts.length < 2 || parts.every((p) => p === "")) {
    return /^(.+)$/;
  }
  const body = parts
    .map((chunk) => chunk.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join("(.+?)");
  return new RegExp(`^${body}$`);
}

/**
 * If `specifier` matches a `paths` key pattern, return the first substitute with `*` segments
 * replaced by capture groups (supports one or more `*` placeholders).
 */
export function matchPathsMapping(
  specifier: string,
  paths: Record<string, string[]>,
): string | null {
  const keys = Object.keys(paths).sort((a, b) => b.length - a.length);
  for (const pattern of keys) {
    const substitutes = paths[pattern];
    if (!substitutes?.length) continue;
    const re = pathPatternToRegex(pattern);
    const m = specifier.match(re);
    if (!m) continue;
    const captures = m.slice(1);
    let out = substitutes[0];
    for (const cap of captures) {
      const idx = out.indexOf("*");
      if (idx === -1) break;
      out = out.slice(0, idx) + cap + out.slice(idx + 1);
    }
    return out;
  }
  return null;
}

function stripLeadingRelativeDots(path: string): string {
  return path.replace(/^\.\//, "").replace(/^\.\.\//, "../");
}

/** Directory (repo-relative) where non-relative imports resolve — `baseUrl` from tsconfig, relative to `configDir`. */
export function effectiveBaseUrlDir(ctx: TsPathsConfig): string {
  const bu = (ctx.baseUrl ?? ".").trim();
  if (bu === "." || bu === "./") return normalizeRepoPath(ctx.configDir);
  const rel = bu.replace(/^\.\//, "");
  return normalizeRepoPath(posixJoin(ctx.configDir, rel));
}

/** Append a paths substitute (e.g. `./src/foo`) to the effective base-url directory. */
export function joinMappedToBase(effectiveBaseDir: string, mappedSubstitute: string): string {
  const cleaned = stripLeadingRelativeDots(mappedSubstitute);
  if (cleaned.startsWith("../")) {
    return normalizeRepoPath(cleaned);
  }
  return normalizeRepoPath(posixJoin(effectiveBaseDir, cleaned));
}

/**
 * Resolve a non-relative import (path alias or `~/`) to a repo-root-relative path **without**
 * file extension (caller applies extension candidates).
 */
export function resolveNonRelativeSpecifierToRepoPath(
  specifier: string,
  ctx: TsPathsConfig,
): string | null {
  const baseDir = effectiveBaseUrlDir(ctx);

  const mapped = matchPathsMapping(specifier, ctx.paths);
  if (mapped) {
    return joinMappedToBase(baseDir, mapped);
  }

  if (specifier.startsWith("~/")) {
    const rest = specifier.slice(2).replace(/^\/+/, "");
    return normalizeRepoPath(posixJoin(baseDir, rest));
  }

  return null;
}

export function pathAliasPrefixesFromPaths(paths: Record<string, string[]>): string[] {
  const out = new Set<string>();
  for (const key of Object.keys(paths)) {
    const i = key.indexOf("*");
    if (i > 0) {
      out.add(key.slice(0, i));
    } else if (!key.includes("*")) {
      out.add(key.endsWith("/") ? key : `${key}/`);
    }
  }
  return [...out];
}

export function parseTsconfigCompilerOptions(raw: string): {
  baseUrl?: string;
  paths?: Record<string, string[]>;
  extends?: string;
} | null {
  try {
    const json = JSON.parse(raw) as { compilerOptions?: Record<string, unknown> };
    const co = json.compilerOptions;
    if (!co || typeof co !== "object") return {};
    const baseUrl = typeof co.baseUrl === "string" ? co.baseUrl : ".";
    const paths = co.paths;
    const extendsVal = typeof (json as { extends?: unknown }).extends === "string"
      ? ((json as { extends: string }).extends)
      : undefined;
    if (!paths || typeof paths !== "object" || Array.isArray(paths)) {
      return { baseUrl, extends: extendsVal };
    }
    const out: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(paths as Record<string, unknown>)) {
      if (Array.isArray(v) && v.every((x) => typeof x === "string")) {
        out[k] = v as string[];
      }
    }
    return { baseUrl, paths: out, extends: extendsVal };
  } catch {
    return null;
  }
}

export function mergePathsConfig(
  base: TsPathsConfig | null,
  overlay: { baseUrl?: string; paths?: Record<string, string[]> },
  overlayConfigDir: string,
): TsPathsConfig {
  const paths = { ...(base?.paths ?? {}), ...(overlay.paths ?? {}) };
  const baseUrl = overlay.baseUrl ?? base?.baseUrl ?? ".";
  return {
    configDir: overlayConfigDir,
    baseUrl,
    paths,
  };
}
