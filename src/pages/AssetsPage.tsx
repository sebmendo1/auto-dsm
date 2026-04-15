import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Copy, ExternalLink, ImageIcon, LayoutGrid, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import type { ParseResult, RepoAsset } from "@/lib/parser";
import { readStoredTokens } from "@/lib/parser/storage";
import { extractImageAssetsFromRepo } from "@/lib/github/fetcher";
import { isDemoRepo } from "@/lib/demo/demo-mode";
import { notifyAppDataUpdated } from "@/lib/app-events";

const ASSETS_REPO_KEY = "autodsm:assetsRepo";
const VIEW_MODE_KEY = "autodsm:assetsViewMode";

type ViewMode = "cards" | "list";

function readStoredAssetsRepo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ASSETS_REPO_KEY);
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readInitialViewMode(): ViewMode {
  if (typeof window === "undefined") return "cards";
  const v = sessionStorage.getItem(VIEW_MODE_KEY);
  return v === "list" ? "list" : "cards";
}

async function fetchRepoAssetsFromApi(repoFullName: string): Promise<{
  assets: RepoAsset[];
  defaultBranch?: string;
} | null> {
  try {
    const res = await fetch(`/api/github/repo-assets?repo=${encodeURIComponent(repoFullName)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { assets?: RepoAsset[]; defaultBranch?: string };
    if (!Array.isArray(json.assets)) return null;
    return { assets: json.assets, defaultBranch: json.defaultBranch };
  } catch {
    return null;
  }
}

function AssetsLoadingSkeleton({
  viewMode,
  repoLabel,
}: {
  viewMode: ViewMode;
  repoLabel: string | null;
}) {
  const skeletonCount = viewMode === "cards" ? 6 : 8;
  return (
    <div
      className="min-h-[22rem] space-y-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading asset library"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-foreground-tertiary" aria-hidden />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Scanning repository for images</p>
              <p className="text-xs text-foreground-tertiary">
                Fetching the file tree from GitHub{repoLabel ? ` · ${repoLabel}` : ""}. Large repos may
                take a few seconds.
              </p>
            </div>
          </div>
          <Skeleton className="h-8 w-48 max-w-full sm:h-9" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-border bg-background-elevated p-1">
          <Skeleton className="h-9 w-[4.5rem] rounded-md" />
          <Skeleton className="h-9 w-[4.5rem] rounded-md" />
        </div>
      </div>

      {viewMode === "cards" ? (
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <li key={i}>
              <Card className="flex flex-col overflow-hidden p-0">
                <Skeleton className="aspect-video w-full rounded-none rounded-t-lg" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-40 max-w-[85%]" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
                <div className="flex gap-2 border-t border-border px-4 py-3">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {Array.from({ length: skeletonCount }, (_, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-4 py-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-36 max-w-[70%]" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-12" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetsPage() {
  const [tokens, setTokens] = useState<ParseResult | null>(() =>
    typeof document !== "undefined" ? readStoredTokens() : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readInitialViewMode());
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state");
  const repo = searchParams.get("repo");
  const lastRepo =
    typeof document !== "undefined" ? localStorage.getItem("autodsm:lastRepo") : null;

  const persistViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(VIEW_MODE_KEY, mode);
    }
  }, []);

  const targetRepo = repo ?? lastRepo;
  const assets = useMemo(() => tokens?.assets ?? [], [tokens?.assets]);

  useEffect(() => {
    if (!targetRepo) return;
    if (isDemoRepo(targetRepo)) return;
    const assetsRepo = readStoredAssetsRepo();
    const missingKey = tokens?.assets === undefined;
    const shouldParse =
      state === "parsing" || assetsRepo !== targetRepo || (missingKey && assets.length === 0);
    if (!shouldParse) return;

    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const api = await fetchRepoAssetsFromApi(targetRepo);
        const extracted = api?.assets ?? (await extractImageAssetsFromRepo(targetRepo));
        if (!mounted) return;
        if (api?.defaultBranch) {
          localStorage.setItem("autodsm:repoBranch", api.defaultBranch);
        }
        const prev = readStoredTokens();
        const payload: ParseResult = {
          colors: prev?.colors ?? [],
          typography: prev?.typography ?? [],
          typographyRows: prev?.typographyRows,
          assets: extracted,
        };
        setTokens(payload);
        localStorage.setItem("autodsm:tokens", JSON.stringify(payload));
        localStorage.setItem(ASSETS_REPO_KEY, targetRepo);
        localStorage.setItem("autodsm:lastRepo", targetRepo);
        notifyAppDataUpdated();
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load assets");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [targetRepo, state, tokens?.assets, assets.length]);

  const copyUrl = useCallback(async (url: string, label: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setToast(`Copied ${label}`);
      } else {
        setToast("Clipboard unavailable");
      }
    } catch {
      setToast("Could not copy");
    }
  }, []);

  const hasContent = assets.length > 0;
  const count = assets.length;
  const showInitialSkeleton = loading && !hasContent;
  const isRefreshing = loading && hasContent;

  return (
    <div className="box-border -mx-5 -mt-8 flex min-h-0 w-[calc(100%_+_2.5rem)] min-w-0 max-w-none flex-1 flex-col self-stretch sm:-mx-8 sm:-mt-10 sm:w-[calc(100%_+_4rem)]">
      <header className="box-border h-fit w-full min-w-0 shrink-0 self-stretch border-b border-border px-4 pb-4 pt-4">
        <h6 className="text-base font-semibold leading-6 tracking-normal text-foreground">Assets</h6>
      </header>

      <div className="mx-auto w-full max-w-[700px] flex-1 space-y-8 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
        {showInitialSkeleton ? (
          <AssetsLoadingSkeleton viewMode={viewMode} repoLabel={targetRepo} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-foreground-secondary">{error}</p>
          </div>
        ) : !targetRepo && !hasContent ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No repository linked</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              Connect a repository from the dashboard to discover images in your project.
            </p>
          </div>
        ) : !hasContent ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No image assets found</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              No PNG, JPG, SVG, or other supported images were found in common paths for this
              repository.
            </p>
          </div>
        ) : (
          <>
            {isRefreshing ? (
              <div
                className="flex items-center gap-3 rounded-lg border border-border bg-background-elevated/90 px-4 py-3 text-sm text-foreground-secondary shadow-sm backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground-tertiary" aria-hidden />
                <span>Refreshing asset list from GitHub…</span>
              </div>
            ) : null}

            <section className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Asset library
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
                    Images discovered in your repository tree. Previews load from raw GitHub URLs;
                    click a row or card to copy the image URL.
                  </p>
                  <p className="mt-2 text-xs text-foreground-tertiary">
                    {count} asset{count === 1 ? "" : "s"}
                    {targetRepo ? ` · Source: ${targetRepo}` : ""}
                  </p>
                </div>
                <div
                  className="flex shrink-0 gap-1 rounded-lg border border-border bg-background-elevated p-1"
                  role="group"
                  aria-label="View mode"
                >
                  <Button
                    type="button"
                    variant={viewMode === "cards" ? "secondary" : "ghost"}
                    className="px-3 py-1.5"
                    onClick={() => persistViewMode("cards")}
                    aria-pressed={viewMode === "cards"}
                    disabled={isRefreshing}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only sm:ml-1">Cards</span>
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    className="px-3 py-1.5"
                    onClick={() => persistViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    disabled={isRefreshing}
                  >
                    <List className="h-4 w-4" aria-hidden />
                    <span className="sr-only sm:not-sr-only sm:ml-1">List</span>
                  </Button>
                </div>
              </div>
            </section>

            <div
              className={isRefreshing ? "pointer-events-none opacity-60 transition-opacity" : undefined}
              aria-busy={isRefreshing}
            >
              {viewMode === "cards" ? (
                <VirtualAssetsCardRows assets={assets} onCopy={copyUrl} />
              ) : (
                <VirtualAssetsListRows assets={assets} onCopy={copyUrl} />
              )}
            </div>
          </>
        )}
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}

const linkGhostSm =
  "inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60";

function AssetCard({
  asset,
  onCopy,
}: {
  asset: RepoAsset;
  onCopy: (url: string, label: string) => void | Promise<void>;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <button
        type="button"
        className="flex w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-border"
        aria-label={`Copy URL for ${asset.name}`}
        onClick={() => void onCopy(asset.rawUrl, asset.name)}
      >
        <div className="flex aspect-video items-center justify-center bg-background-tertiary/40">
          {!imgFailed ? (
            <img
              src={asset.rawUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="flex flex-col items-center gap-2 p-6 text-foreground-tertiary">
              <ImageIcon className="h-10 w-10" aria-hidden />
              <span className="text-xs">{asset.extension.toUpperCase()}</span>
            </span>
          )}
        </div>
        <div className="space-y-1 p-4">
          <p className="truncate text-sm font-semibold text-foreground">{asset.name}</p>
          <p className="truncate font-mono text-xs text-foreground-tertiary" title={asset.path}>
            {asset.path}
          </p>
        </div>
      </button>
      <div className="flex gap-2 border-t border-border px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 px-2 py-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            void onCopy(asset.rawUrl, "URL");
          }}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy URL
        </Button>
        <a
          href={asset.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className={linkGhostSm}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          GitHub
        </a>
      </div>
    </Card>
  );
}

function AssetListRow({
  asset,
  onCopy,
}: {
  asset: RepoAsset;
  onCopy: (url: string, label: string) => void | Promise<void>;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-4 py-4">
      <button
        type="button"
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background-tertiary/40 outline-none focus-visible:ring-2 focus-visible:ring-border"
        aria-label={`Copy URL for ${asset.name}`}
        onClick={() => void onCopy(asset.rawUrl, asset.name)}
      >
        {!imgFailed ? (
          <img
            src={asset.rawUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-foreground-tertiary">
            <ImageIcon className="h-6 w-6" aria-hidden />
          </span>
        )}
      </button>
      <button
        type="button"
        className="min-w-0 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-border"
        onClick={() => void onCopy(asset.rawUrl, asset.name)}
      >
        <span className="block truncate text-sm font-semibold text-foreground">{asset.name}</span>
        <span className="mt-1 block truncate font-mono text-xs text-foreground-tertiary" title={asset.path}>
          {asset.path}
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="font-mono text-xs text-foreground-tertiary">{asset.extension}</span>
        <span className="text-xs text-foreground-tertiary">{formatBytes(asset.size)}</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            className="h-8 w-8 p-0"
            aria-label="Copy raw URL"
            onClick={() => void onCopy(asset.rawUrl, "URL")}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <a
            href={asset.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
            aria-label="Open on GitHub"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

const CARD_ROW_GAP = 16;
const CARD_ROW_HEIGHT_EST = 312;

function VirtualAssetsCardRows({
  assets,
  onCopy,
}: {
  assets: RepoAsset[];
  onCopy: (url: string, label: string) => void | Promise<void>;
}) {
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(3);
      else if (w >= 640) setCols(2);
      else setCols(1);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const rowCount = cols > 0 ? Math.ceil(assets.length / cols) : 0;

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => CARD_ROW_HEIGHT_EST + CARD_ROW_GAP,
    overscan: 2,
  });

  if (assets.length === 0) return null;

  return (
    <div
      className="w-full"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((vRow) => {
        const start = vRow.index * cols;
        const slice = assets.slice(start, start + cols);
        return (
          <div
            key={vRow.key}
            data-index={vRow.index}
            ref={rowVirtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${vRow.start}px)` }}
          >
            <ul
              className={`m-0 grid list-none gap-4 p-0 ${
                cols === 1
                  ? "grid-cols-1"
                  : cols === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {slice.map((asset) => (
                <li key={asset.path}>
                  <AssetCard asset={asset} onCopy={onCopy} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

const LIST_ROW_HEIGHT_EST = 112;

function VirtualAssetsListRows({
  assets,
  onCopy,
}: {
  assets: RepoAsset[];
  onCopy: (url: string, label: string) => void | Promise<void>;
}) {
  const rowVirtualizer = useWindowVirtualizer({
    count: assets.length,
    estimateSize: () => LIST_ROW_HEIGHT_EST,
    overscan: 8,
  });

  if (assets.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-border"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((vi) => {
        const asset = assets[vi.index];
        return (
          <div
            key={asset.path}
            data-index={vi.index}
            ref={rowVirtualizer.measureElement}
            className={`absolute left-0 top-0 w-full ${
              vi.index < assets.length - 1 ? "border-b border-border" : ""
            }`}
            style={{ transform: `translateY(${vi.start}px)` }}
          >
            <AssetListRow asset={asset} onCopy={onCopy} />
          </div>
        );
      })}
    </div>
  );
}
