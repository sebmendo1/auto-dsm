"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useDashboardShell } from "./dashboard-shell-context";
import { DashboardNavLinks } from "./dashboard-nav-links";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar({ userLabel }: { userLabel?: string }) {
  const { sidebarCollapsed } = useDashboardShell();

  const hidden = sidebarCollapsed;

  return (
    <aside
      aria-hidden={hidden}
      inert={hidden ? true : undefined}
      className={cn(
        "shrink-0 self-stretch min-h-0 sticky top-0 flex flex-col bg-[var(--bg-canvas)] font-medium",
        "transition-[width,opacity,padding] duration-200 ease-out motion-reduce:transition-none",
        hidden
          ? "w-0 max-w-0 overflow-hidden border-0 p-0 opacity-0 pointer-events-none"
          : "h-full min-h-0 w-[240px] overflow-x-hidden pl-[8px] pr-0 pt-0 pb-[12px] opacity-100",
      )}
    >
      <ScrollArea className="h-full min-h-0 flex-1 pr-0.5">
        <DashboardNavLinks userLabel={userLabel} />
      </ScrollArea>
    </aside>
  );
}
