"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Palette,
  Rocket,
  Type,
  LogOut,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Box,
} from "lucide-react";
import type { DiscoveredComponent } from "@/lib/github/types";

const tokenItems = [
  { label: "Colors", href: "/dashboard/brand/colors", icon: Palette },
  { label: "Typography", href: "/dashboard/brand/typography", icon: Type },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [components, setComponents] = useState<DiscoveredComponent[]>([]);
  const [componentsOpen, setComponentsOpen] = useState(true);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [componentsError, setComponentsError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRepo = localStorage.getItem("autodsm:lastRepo");
    const storedComponents = localStorage.getItem("autodsm:components");
    if (storedComponents) {
      try {
        const parsed = JSON.parse(storedComponents) as DiscoveredComponent[];
        setComponents(parsed);
      } catch {
        // ignore parse errors
      }
    }
    if (!storedRepo) return;

    let active = true;
    const fetchComponents = async () => {
      try {
        setComponentsLoading(true);
        setComponentsError(null);
        const res = await fetch("/api/github/discover-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoFullName: storedRepo }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to discover components");
        }
        if (!active) return;
        setComponents(data.components || []);
        localStorage.setItem("autodsm:components", JSON.stringify(data.components || []));
      } catch (error) {
        if (!active) return;
        setComponentsError(error instanceof Error ? error.message : "Failed to discover components");
      } finally {
        if (active) setComponentsLoading(false);
      }
    };

    fetchComponents();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-background-secondary pb-6 pt-6 transition-all ${
        collapsed ? "w-20 px-3" : "w-64 px-4"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className={`mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground ${
          collapsed ? "justify-center" : ""
        }`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      <Link
        href="/dashboard"
        className={`mb-6 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-background-tertiary ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Rocket className="h-4 w-4" />
        {collapsed ? null : "Get started"}
      </Link>

      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          {collapsed ? null : (
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-foreground-tertiary">
              Brand guidelines
            </p>
          )}
          <div className="space-y-1">
            {tokenItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {collapsed ? null : item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setComponentsOpen((value) => !value)}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium uppercase tracking-wide text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground ${
              collapsed ? "justify-center" : ""
            }`}
            aria-expanded={componentsOpen}
          >
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
              {collapsed ? null : componentsOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>{collapsed ? "Components" : "Components"}</span>
            </div>
            {collapsed ? null : (
              <span className="text-[11px] text-foreground-tertiary">
                {components.length}
              </span>
            )}
          </button>

          {componentsOpen ? (
            <div className="space-y-1">
              {componentsLoading ? (
                <div className="px-3 py-2 text-xs text-foreground-tertiary">
                  Loading components...
                </div>
              ) : componentsError ? (
                <div className="px-3 py-2 text-xs text-foreground-tertiary">
                  {componentsError}
                </div>
              ) : components.length === 0 ? (
                <div className="px-3 py-2 text-xs text-foreground-tertiary">
                  No components found
                </div>
              ) : (
                components.map((component) => {
                  const href = `/dashboard/components/${component.slug}`;
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={component.slug}
                      href={href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-background-tertiary text-foreground"
                          : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Box className="h-4 w-4 text-foreground-tertiary" />
                      {collapsed ? null : component.name}
                    </Link>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <div
          className={`flex items-center gap-3 px-3 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="h-9 w-9 rounded-full bg-background-tertiary" />
          {collapsed ? null : (
            <div className="flex-1">
              <p className="text-sm font-medium">you@github</p>
              <p className="text-xs text-foreground-tertiary">Signed in</p>
            </div>
          )}
          <button className="rounded-md p-2 text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
