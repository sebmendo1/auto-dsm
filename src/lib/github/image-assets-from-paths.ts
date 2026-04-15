import type { RepoAsset } from "@/lib/parser/types";

const IMAGE_PATH_REGEX = /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i;

function shouldExcludeAssetPath(path: string): boolean {
  const p = path.toLowerCase();
  return (
    p.includes("node_modules/") ||
    p.includes("/.git/") ||
    p.startsWith(".git/") ||
    p.includes("/dist/") ||
    p.startsWith("dist/") ||
    p.includes("/build/") ||
    p.startsWith("build/") ||
    p.includes("/.next/") ||
    p.includes("/coverage/") ||
    p.includes("/.cache/") ||
    p.includes("/vendor/") ||
    p.includes("/__snapshots__/") ||
    p.includes("/.turbo/")
  );
}

function assetPathPriority(path: string): number {
  const p = path.toLowerCase();
  if (p.startsWith("public/")) return 100;
  if (p.startsWith("static/")) return 95;
  if (p.startsWith("assets/")) return 90;
  if (p.includes("/assets/")) return 85;
  if (p.startsWith("src/assets/")) return 84;
  if (p.includes("/images/") || p.includes("/image/")) return 80;
  if (p.includes("/icons/") || p.includes("/icon/")) return 75;
  if (p.includes("/media/") || p.includes("/img/")) return 70;
  return 0;
}

function encodePathForUrl(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export type TreeBlobMeta = { path: string; size?: number };

/**
 * Build image asset list from repo tree paths (no network). Shared by client fetcher and server API.
 */
export function buildRepoAssetsFromTreeBlobs(
  blobs: TreeBlobMeta[],
  owner: string,
  repo: string,
  branch: string,
  maxItems = 150,
): RepoAsset[] {
  const seen = new Set<string>();
  const candidates = blobs.filter((file) => {
    if (!IMAGE_PATH_REGEX.test(file.path) || shouldExcludeAssetPath(file.path)) return false;
    const key = file.path.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  candidates.sort((a, b) => {
    const pr = assetPathPriority(b.path) - assetPathPriority(a.path);
    if (pr !== 0) return pr;
    return a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
  });

  const encodedRef = encodeURIComponent(branch);
  const sliced = candidates.slice(0, maxItems);

  return sliced.map((file) => {
    const extMatch = file.path.match(/\.([^.]+)$/i);
    const extension = (extMatch?.[1] ?? "").toLowerCase();
    const encodedPath = encodePathForUrl(file.path);
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${encodedRef}/${encodedPath}`;
    const htmlUrl = `https://github.com/${owner}/${repo}/blob/${encodedRef}/${encodedPath}`;
    const name = file.path.split("/").pop() ?? file.path;
    return {
      path: file.path,
      name,
      extension,
      size: typeof file.size === "number" ? file.size : 0,
      rawUrl,
      htmlUrl,
    };
  });
}
