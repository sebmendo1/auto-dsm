import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, FileText, Image as ImageIcon, Package, Palette } from "lucide-react";
import { MetricTile } from "@/components/dashboard/MetricTile";
import { RecentChangesList, type RecentChangeItem } from "@/components/dashboard/RecentChangesList";
import { parseRepoUrl } from "@/lib/parser/github";
import { readStoredTokens } from "@/lib/parser/storage";
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
  const [recent, setRecent] = useState<RecentChangeItem[]>(FALLBACK_RECENT);

  const refreshData = useCallback(() => {
    const stored = readStoredTokens();
    const colors = stored?.colors?.length ?? 0;
    const typo = stored?.typography?.length ?? 0;
    setTokenCount(colors + typo);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = repoInput.trim();
    const parsed = parseRepoUrl(value);
    if (!parsed) {
      setError("Enter a public GitHub repo link or owner/name");
      return;
    }
    setError("");
    navigate(
      `/dashboard/brand/colors?state=parsing&repo=${encodeURIComponent(
        `${parsed.owner}/${parsed.repo}`,
      )}`,
    );
  };

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-content-primary sm:text-[1.75rem]">
          AutoDSM
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-content-muted">
          Here are all your active components and performance metrics around them.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Design tokens" value={tokenCount} icon={Palette} />
          <MetricTile label="Components" value={componentCount} icon={Box} />
          <MetricTile label="Visual assets" value="—" icon={ImageIcon} />
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
