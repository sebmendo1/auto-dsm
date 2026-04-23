"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProductWordmark } from "@/components/brand/product-mark";
import { cn } from "@/lib/utils";

const STEP_PATHS = [
  "/onboarding/account",
  "/onboarding/welcome",
  "/onboarding/role",
  "/onboarding/team",
  "/onboarding/company",
  "/onboarding/connect",
  "/onboarding/scanning",
] as const;

const TOTAL = STEP_PATHS.length;

function stepIndexForPathname(path: string | null): number {
  if (!path) return 0;
  if (path === "/onboarding" || path.startsWith("/onboarding/unsupported")) return -1;
  if (path.startsWith("/onboarding/complete")) return TOTAL;
  const i = STEP_PATHS.findIndex((p) => path === p);
  if (i >= 0) return i;
  return 0;
}

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const idx = stepIndexForPathname(pathname);
  const showBar = idx >= 0 && idx < TOTAL;
  const pct = showBar ? Math.round(((idx + 1) / TOTAL) * 100) : 0;
  const accountStep = pathname === "/onboarding/account";
  const hideChrome = pathname?.startsWith("/onboarding/complete");

  if (hideChrome) {
    return (
      <div className="flex min-h-screen min-h-0 flex-col bg-[var(--bg-primary)]">{children}</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 w-full min-w-0 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur">
        {showBar ? (
          <div
            className="h-1 w-full overflow-hidden bg-[var(--bg-tertiary)]"
            role="progressbar"
            aria-valuenow={idx + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-label={`Step ${idx + 1} of ${TOTAL}`}
          >
            <div
              className="h-full min-h-[4px] bg-[var(--accent)] transition-[width] duration-300 [transition-timing-function:var(--ease-standard)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : (
          <div className="h-1 w-full min-h-1 bg-[var(--bg-tertiary)]" aria-hidden />
        )}
        <div className="mx-auto flex h-14 max-w-[1200px] w-full min-w-0 items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/login"
            className="inline-flex min-w-0 items-center"
            aria-label="autoDSM home"
          >
            <ProductWordmark width={120} priority className="max-w-[min(100%,9rem)]" />
          </Link>
          {accountStep ? (
            <Link
              href="/login?mode=login"
              className="shrink-0 inline-flex h-9 items-center justify-center rounded-full bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--accent-fg)] [font-family:var(--font-geist-sans)] hover:opacity-90 [transition:opacity_0.15s_var(--ease-standard)]"
            >
              Log in
            </Link>
          ) : (
            <Link
              href="/login?mode=login"
              className="shrink-0 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] [font-family:var(--font-geist-sans)] [transition:color_0.15s_var(--ease-standard)]"
            >
              Log in
            </Link>
          )}
        </div>
      </header>
      <div className="flex-1 flex min-h-0 flex-col">{children}</div>
    </div>
  );
}

export function OnboardingStepCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full min-w-0 max-w-[460px] flex-1 flex-col justify-center px-4 py-8 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
