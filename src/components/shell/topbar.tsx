"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Github } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useBrandStore } from "@/stores/brand";
import { CATEGORY_LABELS } from "@/lib/brand/types";

function titleFromPath(pathname: string, repoSlug: string | null): {
  repo: string;
  section: string | null;
} {
  const segments = pathname.split("/").filter(Boolean);
  // /dashboard, /dashboard/colors, /dashboard/settings
  const lastSeg = segments[segments.length - 1] ?? "";
  const section =
    segments[0] === "dashboard" && segments.length > 1
      ? CATEGORY_LABELS[lastSeg] ?? (lastSeg === "settings" ? "Settings" : null)
      : null;
  return { repo: repoSlug ?? "—", section };
}

export function TopBar() {
  const pathname = usePathname();
  const { repoSlug, profile } = useBrandStore();
  const { repo, section } = titleFromPath(pathname, repoSlug);

  return (
    <div className="flex items-center justify-between h-14 px-6 border-b border-[var(--border-subtle)]">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-body-s text-[var(--text-secondary)] truncate">
          {repo}
        </span>
        {section ? (
          <>
            <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
            <span className="text-body-s text-[var(--text-primary)] font-medium">
              {section}
            </span>
          </>
        ) : (
          <>
            <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
            <span className="text-body-s text-[var(--text-primary)] font-medium">Overview</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {profile?.repo?.url ? (
          <Link
            href={profile.repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Github size={14} strokeWidth={1.5} />
            <span>View on GitHub</span>
          </Link>
        ) : null}
        <ThemeToggle />
      </div>
    </div>
  );
}
