import type { TsPathsConfig } from "@/lib/github/tsconfig-paths";

export type CachedComponentPayload = {
  name: string;
  filePath: string;
  source: string;
  dependencies: string[];
  hasDefaultExport: boolean;
  exportName: string;
  virtualRepoFiles?: Record<string, string>;
  globalCssRepoPaths?: string[];
  useTailwindInPreview?: boolean;
  sandpackPathContext?: TsPathsConfig;
};

const memory = new Map<string, CachedComponentPayload>();

const PERSIST_VERSION = 3;
const PERSIST_PREFIX = `autodsm:compSrc:v${PERSIST_VERSION}:`;

export function cacheKeyForComponent(repo: string, slug: string): string {
  return `${repo}::${slug}`;
}

function persistStorageKey(compoundKey: string): string {
  return `${PERSIST_PREFIX}${encodeURIComponent(compoundKey)}`;
}

function isStringRecord(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    if (typeof val !== "string") return false;
  }
  return true;
}

/** Parse JSON body from `GET /api/components/:slug`. */
export function parseComponentApiPayload(data: unknown): CachedComponentPayload | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (
    typeof o.name !== "string" ||
    typeof o.filePath !== "string" ||
    typeof o.source !== "string" ||
    !Array.isArray(o.dependencies) ||
    !o.dependencies.every((d) => typeof d === "string") ||
    typeof o.hasDefaultExport !== "boolean" ||
    typeof o.exportName !== "string"
  ) {
    return null;
  }

  let virtualRepoFiles: Record<string, string> | undefined;
  if (o.virtualRepoFiles !== undefined) {
    if (!isStringRecord(o.virtualRepoFiles)) return null;
    virtualRepoFiles = o.virtualRepoFiles;
  }

  let globalCssRepoPaths: string[] | undefined;
  if (Array.isArray(o.globalCssRepoPaths)) {
    if (!o.globalCssRepoPaths.every((x) => typeof x === "string")) return null;
    globalCssRepoPaths = o.globalCssRepoPaths as string[];
  }

  const useTailwindInPreview =
    typeof o.useTailwindInPreview === "boolean" ? o.useTailwindInPreview : undefined;

  let sandpackPathContext: TsPathsConfig | undefined;
  if (o.sandpackPathContext != null) {
    if (typeof o.sandpackPathContext !== "object" || Array.isArray(o.sandpackPathContext)) {
      return null;
    }
    const sp = o.sandpackPathContext as Record<string, unknown>;
    if (typeof sp.configDir !== "string" || typeof sp.baseUrl !== "string") return null;
    if (!sp.paths || typeof sp.paths !== "object" || Array.isArray(sp.paths)) return null;
    const paths: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(sp.paths as Record<string, unknown>)) {
      if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) return null;
      paths[k] = v as string[];
    }
    sandpackPathContext = { configDir: sp.configDir, baseUrl: sp.baseUrl, paths };
  }

  return {
    name: o.name,
    filePath: o.filePath,
    source: o.source,
    dependencies: o.dependencies as string[],
    hasDefaultExport: o.hasDefaultExport,
    exportName: o.exportName,
    virtualRepoFiles,
    globalCssRepoPaths,
    useTailwindInPreview,
    sandpackPathContext,
  };
}

function readPersisted(key: string): CachedComponentPayload | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(persistStorageKey(key));
    if (!raw) return null;
    const row = JSON.parse(raw) as { payload?: unknown };
    return parseComponentApiPayload(row.payload);
  } catch {
    return null;
  }
}

function writePersisted(key: string, payload: CachedComponentPayload): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      persistStorageKey(key),
      JSON.stringify({ payload, savedAt: Date.now() }),
    );
  } catch {
    // Quota or private mode — memory cache still works for the session.
  }
}

export function getCachedComponentSource(key: string): CachedComponentPayload | undefined {
  const mem = memory.get(key);
  if (mem) return mem;
  const disk = readPersisted(key);
  if (disk) {
    memory.set(key, disk);
    return disk;
  }
  return undefined;
}

export function setCachedComponentSource(key: string, payload: CachedComponentPayload): void {
  memory.set(key, payload);
  writePersisted(key, payload);
}

export function clearComponentSourceCache(): void {
  memory.clear();
  if (typeof localStorage === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k?.startsWith("autodsm:compSrc:")) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
