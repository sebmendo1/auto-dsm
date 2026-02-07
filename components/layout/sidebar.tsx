"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Palette,
  Rocket,
  Shapes,
  Type,
  LogOut,
  PanelLeft,
} from "lucide-react";

const navGroups = [
  {
    label: "Brand guidelines",
    items: [
      { label: "Colors", href: "/dashboard/brand/colors", icon: Palette },
      { label: "Typography", href: "/dashboard/brand/typography", icon: Type },
    ],
  },
  {
    label: "Components",
    items: [
      { label: "Buttons", href: "/dashboard/components/buttons", icon: Shapes },
      { label: "Cards", href: "/dashboard/components/cards", icon: LayoutGrid },
      { label: "Inputs", href: "/dashboard/components/inputs", icon: LayoutGrid },
      { label: "Modals", href: "/dashboard/components/modals", icon: LayoutGrid },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

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
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            {collapsed ? null : (
              <p className="px-3 text-xs font-medium uppercase tracking-wide text-foreground-tertiary">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
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
        ))}
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
