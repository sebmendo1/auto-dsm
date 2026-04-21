"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Palette,
  Type,
  Image as ImageIcon,
  Ruler,
  Square,
  CornerDownRight,
  Minus,
  Play,
  Layers,
  Droplets,
  LayoutPanelTop,
  MonitorSmartphone,
  Settings as SettingsIcon,
  Pen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrandStore } from "@/stores/brand";
import { SIDEBAR_SECTIONS, CATEGORY_LABELS } from "@/lib/brand/types";

const ICONS: Record<string, LucideIcon> = {
  colors: Palette,
  typography: Type,
  assets: ImageIcon,
  spacing: Ruler,
  shadows: Square,
  radii: CornerDownRight,
  borders: Minus,
  animations: Play,
  gradients: Layers,
  opacity: Droplets,
  zindex: LayoutPanelTop,
  breakpoints: MonitorSmartphone,
};

function SidebarNavIcon({
  icon: Icon,
  active,
  muted,
  size,
}: {
  icon: LucideIcon;
  active: boolean;
  muted?: boolean;
  size: number;
}) {
  return (
    <Icon
      size={size}
      strokeWidth={active ? 2.5 : 2}
      fill={active ? "currentColor" : "none"}
      className={cn(
        "shrink-0 pointer-events-none transition-[stroke-width,fill] duration-150",
        active ? "font-medium" : "font-semibold",
        active
          ? "text-[var(--accent)]"
          : muted
            ? "text-[var(--text-tertiary)]"
            : "text-[var(--text-secondary)]",
      )}
      aria-hidden
    />
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  muted,
  topLevel,
  iconSize,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  muted?: boolean;
  topLevel?: boolean;
  iconSize?: number;
  onNavigate?: () => void;
}) {
  const size = iconSize ?? (topLevel ? 14 : 13);
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={cn(
        "flex h-8 min-h-8 w-full items-center gap-2 rounded-md text-[12px] leading-4",
        "transition-colors duration-150 [transition-timing-function:var(--ease-standard)]",
        topLevel ? "px-3" : "pl-4 pr-3",
        active
          ? "bg-[var(--accent-subtle)] font-medium text-[var(--accent)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
        muted && !active && "text-[var(--text-tertiary)]",
      )}
    >
      <SidebarNavIcon icon={Icon} active={active} muted={muted} size={size} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function DashboardNavLinks({
  onNavigate,
  userLabel,
}: {
  onNavigate?: () => void;
  userLabel?: string;
}) {
  const pathname = usePathname();
  const profile = useBrandStore((s) => s.profile);

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(SIDEBAR_SECTIONS.map((s) => [s.label, true])),
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col justify-center items-start">
      <nav className="flex h-fit w-full flex-col gap-3 pr-0.5">
        <div className="flex flex-col gap-0">
          <NavLink
            href="/dashboard/agent"
            label="New agent"
            Icon={Pen}
            active={isActive("/dashboard/agent")}
            topLevel
            onNavigate={onNavigate}
          />
          <NavLink
            href="/dashboard"
            label="Dashboard"
            Icon={LayoutDashboard}
            active={isActive("/dashboard")}
            topLevel
            onNavigate={onNavigate}
          />
        </div>

        {SIDEBAR_SECTIONS.map((section) => {
          const open = openSections[section.label] ?? true;
          return (
            <div key={section.label} className="mt-5 first-of-type:mt-5">
              <button
                type="button"
                onClick={() => setOpenSections((s) => ({ ...s, [section.label]: !open }))}
                className="flex w-full items-center justify-between gap-2 px-3 pb-2 text-left text-caption font-semibold tracking-widest text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
              >
                <span>{section.label}</span>
                {open ? (
                  <ChevronUp size={14} strokeWidth={1.5} className="shrink-0 opacity-70" />
                ) : (
                  <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 opacity-70" />
                )}
              </button>
              {open ? (
                <div className="flex flex-col gap-0">
                  {section.items.map((slug) => {
                    const Icon = ICONS[slug];
                    const href = `/dashboard/${slug}`;
                    const hasTokens = profile
                      ? (() => {
                          const key = slug === "zindex" ? "zIndex" : (slug as keyof typeof profile);
                          const val = (profile as unknown as Record<string, unknown>)[key];
                          return Array.isArray(val) && val.length > 0;
                        })()
                      : true;
                    return (
                      <NavLink
                        key={slug}
                        href={href}
                        label={CATEGORY_LABELS[slug]}
                        Icon={Icon}
                        active={isActive(href)}
                        muted={!hasTokens}
                        onNavigate={onNavigate}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto flex h-fit w-full shrink-0 flex-col pt-3">
        <NavLink
          href="/dashboard/settings"
          label="Settings"
          Icon={SettingsIcon}
          active={isActive("/dashboard/settings")}
          topLevel
          onNavigate={onNavigate}
        />
        {userLabel ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg border-0 [background:unset] px-2.5 py-2 text-[12px] leading-4 text-[var(--text-secondary)] shadow-none">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[12px] font-medium text-white">
              {userLabel.slice(0, 1).toUpperCase()}
            </div>
            <span className="min-w-0 flex-1 truncate">{userLabel}</span>
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="shrink-0 text-[var(--text-tertiary)] opacity-70"
              aria-hidden
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
