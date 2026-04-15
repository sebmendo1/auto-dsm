import type { DiscoveredComponent } from "@/lib/github/types";
import { isDemoRepo } from "@/lib/demo/demo-mode";
import {
  cacheKeyForComponent,
  getCachedComponentSource,
  parseComponentApiPayload,
  setCachedComponentSource,
} from "@/lib/sandpack/component-source-cache";

const MAX_SLUGS = 15;
const CONCURRENCY = 4;

async function prefetchOne(repo: string, slug: string, filePath: string, stylePaths: string[]): Promise<void> {
  const key = cacheKeyForComponent(repo, slug);
  if (getCachedComponentSource(key)) return;
  try {
    const branch = typeof localStorage !== "undefined" ? (localStorage.getItem("autodsm:repoBranch") ?? "") : "";
    const branchQ = branch ? `&branch=${encodeURIComponent(branch)}` : "";
    const styleQ =
      stylePaths.length > 0 ? `&stylePaths=${encodeURIComponent(JSON.stringify(stylePaths))}` : "";
    const res = await fetch(
      `/api/components/${encodeURIComponent(slug)}?repo=${encodeURIComponent(repo)}&filePath=${encodeURIComponent(
        filePath,
      )}${branchQ}${styleQ}`,
    );
    const data = await res.json();
    if (!res.ok) return;
    const payload = parseComponentApiPayload(data);
    if (payload) setCachedComponentSource(key, payload);
  } catch {
    // best-effort warm cache
  }
}

/**
 * Bounded parallel prefetch of component source after discovery to warm the in-memory cache.
 */
export function prefetchComponentSources(repo: string, components: DiscoveredComponent[]): void {
  if (isDemoRepo(repo)) return;
  const slice = components.slice(0, MAX_SLUGS);
  let i = 0;

  const worker = async () => {
    for (;;) {
      const idx = i++;
      if (idx >= slice.length) return;
      const c = slice[idx];
      await prefetchOne(repo, c.slug, c.filePath, c.relatedStylePaths ?? []);
    }
  };

  const runners = Array.from({ length: Math.min(CONCURRENCY, slice.length) }, () => worker());
  void Promise.all(runners);
}
