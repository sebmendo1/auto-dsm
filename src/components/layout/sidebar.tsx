import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileType,
  Gauge,
  PanelLeft,
  Palette,
  Settings,
  Type,
} from "lucide-react";
import type { DiscoveredComponent } from "@/lib/github/types";
import { isDemoRepo } from "@/lib/demo/demo-mode";
import { notifyAppDataUpdated } from "@/lib/app-events";
import { prefetchComponentSources } from "@/lib/sandpack/prefetch-component-sources";

/** Lucide stroke width mapped to extra-bold type (~font-weight 800). */
const SIDEBAR_ICON_STROKE = 3.5;

const DISCOVER_TIMEOUT_MS = 45_000;
const COMPONENTS_PROGRESS_BATCH = 60;

const primaryNav = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge, end: true },
  { label: "Typography", to: "/dashboard/brand/typography", icon: Type, end: false },
  { label: "Colors", to: "/dashboard/brand/colors", icon: Palette, end: false },
  { label: "Assets", to: "/dashboard/assets", icon: FileType, end: false },
] as const;

function navActive(pathname: string, to: string, end: boolean) {
  if (end) return pathname === "/dashboard" || pathname === "/dashboard/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function parseStoredComponents(raw: string | null): DiscoveredComponent[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as DiscoveredComponent[];
  } catch {
    // ignore
  }
  return [];
}

function applyComponentsProgressive(
  list: DiscoveredComponent[],
  setComponents: React.Dispatch<React.SetStateAction<DiscoveredComponent[]>>,
) {
  if (list.length === 0) {
    setComponents([]);
    return;
  }
  if (list.length <= COMPONENTS_PROGRESS_BATCH) {
    setComponents(list);
    return;
  }
  let end = COMPONENTS_PROGRESS_BATCH;
  setComponents(list.slice(0, end));
  const step = () => {
    end = Math.min(end + COMPONENTS_PROGRESS_BATCH, list.length);
    setComponents(list.slice(0, end));
    if (end < list.length) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [components, setComponents] = useState<DiscoveredComponent[]>([]);
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsError, setComponentsError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState({ initials: "AD", name: "AutoDSM" });

  const discoverAbortRef = useRef<AbortController | null>(null);
  /** Prevents discover refetch loop when this panel calls `notifyAppDataUpdated` after a successful fetch. */
  const lastFetchedRepoRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const repo = localStorage.getItem("autodsm:lastRepo");
      if (!repo) {
        setWorkspace({ initials: "AD", name: "AutoDSM" });
        return;
      }
      const short = repo.split("/")[1] ?? repo;
      const initials =
        short
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 2)
          .toUpperCase() || "AD";
      setWorkspace({ initials, name: short });
    };
    sync();
    window.addEventListener("autodsm:updated", sync);
    return () => window.removeEventListener("autodsm:updated", sync);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const runDiscover = () => {
      const storedRepo = localStorage.getItem("autodsm:lastRepo");
      const storedRaw = localStorage.getItem("autodsm:components");
      const cached = parseStoredComponents(storedRaw);
      if (cached.length > 0) {
        setComponents(cached);
      }

      if (!storedRepo) {
        discoverAbortRef.current?.abort();
        discoverAbortRef.current = null;
        lastFetchedRepoRef.current = null;
        setComponentsLoading(false);
        setComponentsError(null);
        setComponents([]);
        return;
      }

      if (isDemoRepo(storedRepo)) {
        discoverAbortRef.current?.abort();
        discoverAbortRef.current = null;
        lastFetchedRepoRef.current = storedRepo;
        setComponentsLoading(false);
        setComponentsError(null);
        if (cached.length > 0) setComponents(cached);
        return;
      }

      if (storedRepo === lastFetchedRepoRef.current) {
        setComponentsLoading(false);
        return;
      }

      discoverAbortRef.current?.abort();
      const controller = new AbortController();
      discoverAbortRef.current = controller;

      const timeoutId = window.setTimeout(() => controller.abort(), DISCOVER_TIMEOUT_MS);

      const finish = () => {
        window.clearTimeout(timeoutId);
        setComponentsLoading(false);
        if (discoverAbortRef.current === controller) {
          discoverAbortRef.current = null;
        }
      };

      const fetchOnce = async () => {
        setComponentsLoading(true);
        setComponentsError(null);
        try {
          const res = await fetch("/api/github/discover-components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoFullName: storedRepo }),
            signal: controller.signal,
          });
          const data = (await res.json()) as { components?: unknown; error?: string; defaultBranch?: string; commitSha?: string };
          if (!res.ok) {
            throw new Error(typeof data?.error === "string" ? data.error : "Failed to discover components");
          }
          if (controller.signal.aborted) return;
          const list = (Array.isArray(data.components) ? data.components : []) as DiscoveredComponent[];
          applyComponentsProgressive(list, setComponents);
          localStorage.setItem("autodsm:components", JSON.stringify(list));
          if (typeof data.defaultBranch === "string" && data.defaultBranch.length > 0) {
            localStorage.setItem("autodsm:repoBranch", data.defaultBranch);
          }
          if (typeof data.commitSha === "string" && data.commitSha.length > 0) {
            localStorage.setItem("autodsm:repoCommit", data.commitSha);
          }
          lastFetchedRepoRef.current = storedRepo;
          notifyAppDataUpdated();
          prefetchComponentSources(storedRepo, list);
        } catch (error) {
          lastFetchedRepoRef.current = null;
          if (controller.signal.aborted) {
            setComponentsError(
              error instanceof DOMException && error.name === "AbortError"
                ? "Discovery timed out. Check the API terminal and GitHub rate limits."
                : "Discovery was cancelled.",
            );
          } else {
            setComponentsError(error instanceof Error ? error.message : "Failed to discover components");
          }
        } finally {
          finish();
        }
      };

      void fetchOnce();
    };

    runDiscover();

    const onAppUpdated = () => {
      runDiscover();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "autodsm:lastRepo" || e.key === "autodsm:components") {
        if (e.key === "autodsm:lastRepo") {
          lastFetchedRepoRef.current = null;
        }
        runDiscover();
      }
    };

    window.addEventListener("autodsm:updated", onAppUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("autodsm:updated", onAppUpdated);
      window.removeEventListener("storage", onStorage);
      discoverAbortRef.current?.abort();
      discoverAbortRef.current = null;
    };
  }, []);

  const showRefreshingRow = componentsLoading && components.length > 0;
  const showFullLoading = componentsLoading && components.length === 0;

  return (
    <aside
      className={`sidebar-rail flex h-screen shrink-0 flex-col py-3 text-[13px] leading-snug transition-[width,padding] duration-200 ease-out ${
        collapsed ? "w-[3.25rem] px-1.5" : "w-[13.5rem] px-2 sm:w-56 sm:px-2.5"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className={`mb-1 flex h-8 items-center rounded-md text-sidebar-nav transition-colors hover:bg-sidebar-hover hover:text-sidebar-nav-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
          collapsed ? "justify-center px-0" : "px-2"
        }`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <PanelLeft className="h-4 w-4 shrink-0 opacity-90" strokeWidth={SIDEBAR_ICON_STROKE} />
      </button>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden pt-1">
        <div className="flex flex-col gap-px">
          {primaryNav.map((item) => {
            const active = navActive(pathname, item.to, item.end);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 rounded-md py-[7px] tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
                  collapsed ? "justify-center px-0" : "px-2"
                } ${
                  active
                    ? "bg-sidebar-active font-bold text-sidebar-nav-active"
                    : "font-semibold text-sidebar-nav hover:bg-sidebar-hover hover:text-sidebar-nav-active"
                }`}
              >
                <Icon
                  className={`h-[15px] w-[15px] shrink-0 ${active ? "text-sidebar-nav-active opacity-100" : "opacity-85"}`}
                  strokeWidth={SIDEBAR_ICON_STROKE}
                />
                {collapsed ? null : <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="min-h-0 flex-1">
          <button
            type="button"
            onClick={() => setComponentsOpen((v) => !v)}
            className={`flex w-full items-center gap-1 rounded-md py-1.5 text-left text-[11px] font-semibold tracking-wide text-sidebar-sub transition-colors hover:bg-sidebar-hover hover:text-sidebar-nav ${
              collapsed ? "justify-center px-0" : "px-2"
            }`}
            aria-expanded={componentsOpen}
          >
            {collapsed ? (
              <ChevronDown className="h-3.5 w-3.5 opacity-70" strokeWidth={SIDEBAR_ICON_STROKE} />
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate">Components</span>
                {componentsOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-60" strokeWidth={SIDEBAR_ICON_STROKE} />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-60" strokeWidth={SIDEBAR_ICON_STROKE} />
                )}
              </>
            )}
          </button>

          {componentsOpen && !collapsed ? (
            <div className="mt-0.5 space-y-px pl-3">
              {showRefreshingRow ? (
                <p className="py-1 text-[11px] font-semibold tracking-tight text-sidebar-sub">Updating…</p>
              ) : null}
              {showFullLoading ? (
                <p className="py-2 text-[12px] font-semibold tracking-tight text-sidebar-sub">Loading…</p>
              ) : null}
              {componentsError ? (
                <p className="py-2 text-[12px] font-semibold tracking-tight text-sidebar-sub">{componentsError}</p>
              ) : null}
              {!componentsLoading && !componentsError && components.length === 0 ? (
                <p className="py-2 text-[12px] font-semibold tracking-tight text-sidebar-sub">No components found</p>
              ) : null}
              {components.length > 0 ? (
                <ul className="list-none space-y-px p-0">
                  {components.map((component) => {
                    const href = `/dashboard/components/${component.slug}`;
                    const active = pathname === href;
                    return (
                      <li key={component.slug}>
                        <Link
                          to={href}
                          className={`block truncate rounded-md py-[7px] pr-1 text-[12px] font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
                            active
                              ? "bg-sidebar-active font-bold text-sidebar-nav-active"
                              : "text-sidebar-sub hover:bg-sidebar-hover hover:text-sidebar-nav"
                          }`}
                        >
                          {component.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="mt-auto pt-2.5">
        <div
          className={`flex items-center gap-0.5 rounded-md py-1 transition-colors hover:bg-sidebar-hover ${
            collapsed ? "flex-col px-0 py-1" : "px-1"
          }`}
        >
          <button
            type="button"
            className={`flex min-w-0 items-center gap-2.5 rounded-md py-1 text-left ${collapsed ? "justify-center" : "flex-1 pl-1"}`}
            aria-label="Workspace (coming soon)"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-[10px] font-bold text-white">
              {workspace.initials}
            </div>
            {collapsed ? null : (
              <>
                <span className="min-w-0 flex-1 truncate text-[13px] font-bold tracking-tight text-sidebar-nav-active">
                  {workspace.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-nav-active opacity-80" strokeWidth={SIDEBAR_ICON_STROKE} />
              </>
            )}
          </button>
          <Link
            to="/dashboard/settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-nav transition-colors hover:bg-sidebar-hover hover:text-sidebar-nav-active"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={SIDEBAR_ICON_STROKE} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
