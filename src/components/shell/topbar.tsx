"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/brand/types";

/** Current dashboard tab title only (no repo slug in the chrome). */
function sectionTitleFromPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const lastSeg = segments[segments.length - 1] ?? "";

  if (segments[0] !== "dashboard") {
    return "Dashboard";
  }
  if (segments.length === 1) {
    return "Dashboard";
  }
  if (segments[1] === "agent") {
    return "New agent";
  }
  if (lastSeg === "settings") {
    return "Settings";
  }
  return CATEGORY_LABELS[lastSeg] ?? lastSeg;
}

export function TopBar() {
  const pathname = usePathname();
  const title = sectionTitleFromPath(pathname);

  const segments = pathname.split("/").filter(Boolean);
  const dashboardSlug = segments[1] ?? "";
  const isDesignTokensOrStructureSubsection = [
    "colors",
    "typography",
    "assets",
    "spacing",
    "shadows",
    "radii",
    "borders",
    "animations",
    "gradients",
    "opacity",
    "zindex",
    "breakpoints",
  ].includes(dashboardSlug);

  /** Agent uses a minimal hero + composer; repo title row would duplicate the shell chrome. */
  if (pathname === "/dashboard/agent") {
    return null;
  }

  return (
    <div
      className={[
          "flex h-fit w-full shrink-0 items-center justify-between bg-white px-4 py-3",
          "border-b border-transparent [border-bottom-color:rgba(32,33,34,0.04)]",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center">
        <span className="truncate text-body-s font-medium text-[var(--text-primary)]">{title}</span>
      </div>
    </div>
  );
}
