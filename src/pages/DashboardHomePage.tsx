import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, FileText, Image as ImageIcon, Package, Palette } from "lucide-react";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { RecentChangesList, type RecentChangeItem } from "@/components/dashboard/RecentChangesList";
import { ParsingProgress } from "@/components/parsing/parsing-progress";
import { parseRepoUrl, parseGithubThemeFiles } from "@/lib/parser/github";
import { readStoredTokens } from "@/lib/parser/storage";
import { notifyAppDataUpdated } from "@/lib/app-events";
import type { DiscoveredComponent } from "@/lib/github/types";

const FALLBACK_RECENT: RecentChangeItem[] = [
  { id: "f1", title: "Button", timeLabel: "2 hours ago" },
  { id: "f2", title: "Input Fields", timeLabel: "1 day ago" },
  { id: "f3", title: "Card", timeLabel: "2 days ago" },
];

const TIME_LABELS = ["2 hours ago", "1 day ago", "2 days ago", "Just now"];

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [componentCount, setComponentCount] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [recent, setRecent] = useState<RecentChangeItem[]>(FALLBACK_RECENT);

  // Parsing state
  const [parsingStep, setParsingStep] = useState(-1);
  const [parsingRepo, setParsingRepo] = useState("");
  const [parsingStepData, setParsingStepData] = useState<Record<string, Record<string, unknown>>>({});
  const [parsingError, setParsingError] = useState<number | null>(null);
  const parsingAbortRef = useRef(false);

  const refreshData = useCallback(() => {
    const stored = readStoredTokens();
    const colors = stored?.colors?.length ?? 0;
    const typo = stored?.typography?.length ?? 0;
    setTokenCount(colors + typo);
    setAssetCount(stored?.assets?.length ?? 0);
    let comps: DiscoveredComponent[] = [];
    try {
      const raw = localStorage.getItem("autodsm:components");
      if (raw) comps = JSON.parse(raw) as DiscoveredComponent[];
    } catch {
      comps = [];
    }
    setComponentCount(comps.length);
    if (comps.length > 0) {
      setRecent(
        comps.slice(0, 5).map((c, i) => ({
          id: c.slug,
          title: c.name,
          timeLabel: TIME_LABELS[i % TIME_LABELS.length],
        })),
      );
    } else {
      setRecent(FALLBACK_RECENT);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [pathname, refreshData]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "autodsm:tokens" ||
        e.key === "autodsm:components" ||
        e.key === "autodsm:lastRepo"
      ) {
        refreshData();
      }
    };
    window.addEventListener("storage", onStorage);
    const onFocus = () => refreshData();
    const onAppUpdate = () => refreshData();
    window.addEventListener("focus", onFocus);
    window.addEventListener("autodsm:updated", onAppUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("autodsm:updated", onAppUpdate as EventListener);
    };
  }, [refreshData]);

  const runParsingFlow = useCallback(
    async (repoFullName: string) => {
      parsingAbortRef.current = false;
      setParsingRepo(repoFullName);
      setParsingError(null);

      try {
        // Step 0: Connect
        setParsingStep(0);
        setParsingStepData((d) => ({ ...d, connect: { repoFullName } }));
        localStorage.setItem("autodsm:lastRepo", repoFullName);
        notifyAppDataUpdated();
        await new Promise((r) => setTimeout(r, 300));
        if (parsingAbortRef.current) return;

        // Step 1: Scan file tree
        setParsingStep(1);
        let fileCount = 0;
        try {
          const res = await fetch(
            `/api/github/repo-assets?repo=${encodeURIComponent(repoFullName)}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { assets?: unknown[]; defaultBranch?: string; commitSha?: string };
            fileCount = Array.isArray(data.assets) ? data.assets.length : 0;
            if (typeof data.defaultBranch === "string") {
              localStorage.setItem("autodsm:repoBranch", data.defaultBranch);
            }
            if (typeof data.commitSha === "string") {
              localStorage.setItem("autodsm:repoCommit", data.commitSha);
            }
          }
        } catch {
          // Non-fatal — we still proceed with parsing
        }
        setParsingStepData((d) => ({ ...d, scan: { fileCount } }));
        if (parsingAbortRef.current) return;

        // Step 2: Extract tokens
        setParsingStep(2);
        const result = await parseGithubThemeFiles(repoFullName);
        if (parsingAbortRef.current) return;

        const colorCount = result.colors?.length ?? 0;
        const typographyCount = result.typography?.length ?? 0;
        const tokenTotal = colorCount + typographyCount;
        setParsingStepData((d) => ({ ...d, extract: { tokenCount: tokenTotal } }));

        // Step 3: Categorize
        setParsingStep(3);
        localStorage.setItem("autodsm:tokens", JSON.stringify(result));
        setParsingStepData((d) => ({
          ...d,
          categorize: {
            colorCount,
            typographyCount,
            spacingCount: 0,
          },
        }));
        notifyAppDataUpdated();
        if (parsingAbortRef.current) return;

        // Step 4: Discover components
        setParsingStep(4);
        try {
          const discoverRes = await fetch("/api/github/discover-components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoFullName }),
          });
          if (discoverRes.ok) {
            const data = (await discoverRes.json()) as { components?: unknown[]; defaultBranch?: string; commitSha?: string };
            const list = Array.isArray(data.components) ? data.components : [];
            localStorage.setItem("autodsm:components", JSON.stringify(list));
            if (typeof data.defaultBranch === "string") {
              localStorage.setItem("autodsm:repoBranch", data.defaultBranch);
            }
            if (typeof data.commitSha === "string") {
              localStorage.setItem("autodsm:repoCommit", data.commitSha);
            }
            notifyAppDataUpdated();
          }
        } catch {
          // Non-fatal — components are optional
        }

        if (parsingAbortRef.current) return;

        // Done — navigate to colors page
        setParsingStep(5);
        await new Promise((r) => setTimeout(r, 400));
        navigate("/dashboard/brand/colors");
      } catch (err) {
        setParsingError(parsingStep >= 0 ? parsingStep : 0);
        setError(err instanceof Error ? err.message : "Parsing failed");
      } finally {
        if (!parsingAbortRef.current) {
          setParsingStep(-1);
          refreshData();
        }
      }
    },
    [navigate, parsingStep, refreshData],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = repoInput.trim();
    const parsed = parseRepoUrl(value);
    if (!parsed) {
      setError("Enter a public GitHub repo link or owner/name");
      return;
    }
    setError("");
    const repoFullName = `${parsed.owner}/${parsed.repo}`;
    void runParsingFlow(repoFullName);
  };

  // Show parsing progress overlay
  if (parsingStep >= 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <ParsingProgress
          repoFullName={parsingRepo}
          currentStep={parsingStep}
          stepData={parsingStepData}
          errorStep={parsingError}
        />
      </div>
    );
  }

  const repoOwner = localStorage.getItem("autodsm:lastRepo")?.split("/")[0];
  const greeting = repoOwner ? `Welcome back, ${repoOwner}` : "Welcome back";

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-content-primary sm:text-[1.75rem]">
          {greeting}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-content-muted">
          Here are all your active components and performance metrics around them.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Design tokens" value={tokenCount} icon={Palette} />
          <MetricTile label="Components" value={componentCount} icon={Box} />
          <MetricTile label="Visual assets" value={assetCount || "—"} icon={ImageIcon} />
          <MetricTile label="Documentation" value="—" icon={FileText} />
        </div>
      </section>

      <RecentChangesList items={recent} />

      <section className="rounded-[16px] border border-border bg-surface-card px-5 py-8 shadow-sm sm:px-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Package className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-base font-semibold tracking-tight text-content-primary">
            Connect a repository
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-content-muted">
            Paste a public GitHub URL to scan for design tokens and components. Results feed the
            metrics above and the sidebar.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-stretch gap-3">
            <input
              className="w-full rounded-delicate border border-hairline bg-input-bg px-3 py-2.5 text-sm text-content-primary placeholder:text-content-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
              placeholder="https://github.com/owner/repo"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
            />
            {error ? <p className="text-left text-xs text-accent-red">{error}</p> : null}
            <button type="submit" className="btn-primary w-full sm:w-auto sm:self-center">
              Load repo and parse
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
