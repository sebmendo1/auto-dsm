"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColorToken, ParseResult } from "@/lib/parser";
import { readStoredTokens } from "@/lib/parser/storage";
import { extractColorsFromRepo } from "@/lib/github/fetcher";

export default function ColorsPage() {
  const [tokens, setTokens] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const repo = searchParams.get("repo");

  useEffect(() => {
    setTokens(readStoredTokens());
  }, []);

  useEffect(() => {
    if (state !== "parsing" || !repo) return;
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await extractColorsFromRepo(repo);
        if (!mounted) return;
        const merged = results.flatMap((entry) => entry.colors);
        const deduped = dedupeColors(merged);
        const payload: ParseResult = { colors: deduped, typography: [] };
        setTokens(payload);
        localStorage.setItem("autodsm:tokens", JSON.stringify(payload));
        localStorage.setItem("autodsm:lastRepo", repo);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to parse repo");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [repo, state]);

  const displayColors: ColorToken[] = tokens?.colors ?? [];
  const colorCount = displayColors.length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs text-foreground-tertiary">Brand guidelines</p>
        <h1 className="text-3xl font-semibold">Colors</h1>
      </header>

      <section className="rounded-2xl border border-border bg-background-elevated p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-foreground-secondary">
            {loading ? "Parsing colors..." : `${colorCount} colors`}
          </p>
          {repo ? (
            <span className="text-xs text-foreground-tertiary">Source: {repo}</span>
          ) : null}
        </div>
        {loading ? (
          <div className="rounded-xl border border-border bg-background px-6 py-10 text-center">
            <p className="text-sm text-foreground-secondary">Parsing colors...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-background px-6 py-10 text-center">
            <p className="text-sm text-foreground-secondary">{error}</p>
          </div>
        ) : displayColors.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-6 py-10 text-center">
            <p className="text-sm font-medium">No colors found</p>
            <p className="mt-2 text-xs text-foreground-tertiary">
              No CSS color tokens were detected. Check the repo path or file patterns.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayColors.map((color, index) => (
                <div
                  key={`${color.name}-${index}`}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{color.name || color.value}</p>
                    <p className="text-xs text-foreground-tertiary">
                      {color.category ? color.category : "uncategorized"}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-foreground-tertiary">
                    {color.value}
                  </span>
                </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function dedupeColors(colors: ColorToken[]) {
  const seen = new Map<string, ColorToken>();
  for (const color of colors) {
    const key = `${color.name}:${color.value}`;
    if (!seen.has(key)) {
      seen.set(key, color);
    }
  }
  return Array.from(seen.values());
}
