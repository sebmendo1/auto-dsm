"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
type ComponentSource = {
  name: string;
  filePath: string;
  source: string;
};

export default function ComponentDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [analysis, setAnalysis] = useState<ComponentSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const repo = localStorage.getItem("autodsm:lastRepo");
        const storedComponents = localStorage.getItem("autodsm:components");
        if (!repo || !storedComponents) {
          setError("Missing repository or components list");
          return;
        }
        const components = JSON.parse(storedComponents) as Array<{ slug: string; filePath: string }>;
        const component = components.find((item) => item.slug === slug);
        if (!component) {
          setError("Component not found");
          return;
        }

        const res = await fetch(
          `/api/components/${slug}?repo=${encodeURIComponent(repo)}&filePath=${encodeURIComponent(
            component.filePath,
          )}`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load component");
        }
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load component");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-neutral-400">Loading component...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated px-6 py-6">
        <p className="text-sm text-foreground-secondary">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated px-6 py-6">
        <p className="text-sm text-foreground-secondary">Component not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Components</p>
        <h1 className="text-3xl font-semibold">{analysis.name}</h1>
        <p className="mt-2 text-xs text-foreground-tertiary font-mono">
          {analysis.filePath}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-foreground-secondary">Raw source</p>
        </div>
        <pre className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-background px-4 py-4 text-xs text-foreground-secondary">
          <code>{analysis.source}</code>
        </pre>
      </section>
    </div>
  );
}
