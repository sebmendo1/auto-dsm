import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ComponentWorkbench } from "@/components/component-workbench/ComponentWorkbench";
import { ComponentWorkbenchShell } from "@/components/component-workbench/ComponentWorkbenchShell";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoveredComponent } from "@/lib/github/types";
import {
  cacheKeyForComponent,
  getCachedComponentSource,
  parseComponentApiPayload,
  setCachedComponentSource,
  type CachedComponentPayload,
} from "@/lib/sandpack/component-source-cache";

function componentFileLabelForSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined;
  try {
    const raw = localStorage.getItem("autodsm:components");
    if (!raw) return undefined;
    const components = JSON.parse(raw) as DiscoveredComponent[];
    const c = components.find((item) => item.slug === slug);
    if (!c) return undefined;
    return c.fileName || c.filePath.split("/").pop();
  } catch {
    return undefined;
  }
}

function LoadingWorkbench({ title }: { title?: string }) {
  return (
    <ComponentWorkbenchShell title={title}>
      <div className="max-w-4xl space-y-2">
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch lg:gap-8">
        <div className="flex min-h-0 flex-col space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3 rounded-lg border border-border p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[min(420px,50vh)] w-full rounded-md" />
          </div>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-surface-card p-5">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </ComponentWorkbenchShell>
  );
}

export function ComponentSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CachedComponentPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState<string>("");

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Missing slug");
      return;
    }

    let cancelled = false;
    setError(null);
    setLoading(true);

    const run = async () => {
      const repoFull = localStorage.getItem("autodsm:lastRepo");
      const storedComponents = localStorage.getItem("autodsm:components");
      if (!repoFull || !storedComponents) {
        if (!cancelled) {
          setLoading(false);
          setData(null);
          setError("Missing repository or components list");
        }
        return;
      }

      const components = JSON.parse(storedComponents) as DiscoveredComponent[];
      const component = components.find((item) => item.slug === slug);
      if (!component) {
        if (!cancelled) {
          setLoading(false);
          setData(null);
          setError("Component not found");
        }
        return;
      }

      const key = cacheKeyForComponent(repoFull, slug);
      const cached = getCachedComponentSource(key);
      if (cached && !cancelled) {
        setData(cached);
        setLoading(false);
      } else if (!cancelled) {
        setData(null);
        setLoading(true);
      }
      if (!cancelled) setRepo(repoFull);

      const styles = component.relatedStylePaths ?? [];
      const styleQ =
        styles.length > 0 ? `&stylePaths=${encodeURIComponent(JSON.stringify(styles))}` : "";

      try {
        const branch = localStorage.getItem("autodsm:repoBranch") ?? "";
        const branchQ = branch ? `&branch=${encodeURIComponent(branch)}` : "";
        const res = await fetch(
          `/api/components/${encodeURIComponent(slug)}?repo=${encodeURIComponent(repoFull)}&filePath=${encodeURIComponent(
            component.filePath,
          )}${branchQ}${styleQ}`,
        );
        const json = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          if (getCachedComponentSource(key)) return;
          throw new Error(typeof json?.error === "string" ? json.error : "Failed to load component");
        }
        const payload = parseComponentApiPayload(json);
        if (!payload) {
          if (getCachedComponentSource(key)) return;
          throw new Error("Invalid response from server");
        }
        setCachedComponentSource(key, payload);
        setData(payload);
      } catch (err) {
        if (!cancelled) {
          if (getCachedComponentSource(key)) {
            setError(null);
          } else {
            setError(err instanceof Error ? err.message : "Failed to load component");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <LoadingWorkbench title={componentFileLabelForSlug(slug)} />;
  }

  if (error) {
    return (
      <ComponentWorkbenchShell title={componentFileLabelForSlug(slug)}>
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <p className="text-sm text-foreground-secondary">{error}</p>
        </div>
      </ComponentWorkbenchShell>
    );
  }

  if (!data || !slug) {
    return (
      <ComponentWorkbenchShell title={componentFileLabelForSlug(slug)}>
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <p className="text-sm text-foreground-secondary">Component not found.</p>
        </div>
      </ComponentWorkbenchShell>
    );
  }

  return <ComponentWorkbench slug={slug} data={data} repo={repo} />;
}
