"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pen,
  Settings,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CATEGORY_LABELS, SIDEBAR_SECTIONS } from "@/lib/brand/types";
import { cn } from "@/lib/utils";

const QUICK: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agent", label: "New agent", icon: Pen },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function NavCommand({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "hidden h-8 w-full gap-2 border-0 bg-[var(--bg-tertiary)] px-2.5 text-[12px] text-[var(--text-secondary)] md:inline-flex",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5 opacity-70" strokeWidth={1.5} />
        <span className="hidden lg:inline">Jump to…</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded-lg bg-[var(--bg-primary)] px-1.5 font-mono text-[10px] font-medium text-[var(--text-tertiary)] sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="inline-flex h-8 w-8 border-0 bg-[var(--bg-tertiary)] md:hidden"
        aria-label="Open command palette"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" strokeWidth={1.5} />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Jump to" description="Search pages and token categories">
        <CommandInput placeholder="Search pages…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Quick">
            {QUICK.map(({ href, label, icon: Icon }) => (
              <CommandItem
                key={href}
                value={`${label} ${href}`}
                onSelect={() => {
                  router.push(href);
                  setOpen(false);
                }}
              >
                <Icon className="size-4 opacity-70" aria-hidden />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          {SIDEBAR_SECTIONS.map((section) => (
            <CommandGroup key={section.label} heading={section.label}>
              {section.items.map((slug) => {
                const href = `/dashboard/${slug}`;
                const label = CATEGORY_LABELS[slug];
                return (
                  <CommandItem
                    key={href}
                    value={`${label} ${slug} ${href}`}
                    onSelect={() => {
                      router.push(href);
                      setOpen(false);
                    }}
                  >
                    <Sparkles className="size-4 opacity-50" />
                    {label}
                    <CommandShortcut className="font-mono text-[10px]">{slug}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
