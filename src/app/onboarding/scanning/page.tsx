"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductIcon } from "@/components/brand/product-mark";
import { ScanTokenCategoryGrid } from "@/components/onboarding/scan-token-category-grid";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isPreviewOnboardingEnabled, setPreviewOnboarding } from "@/lib/onboarding/storage";

const STEPS = [
  "Fetching repository…",
  "Detecting framework…",
  "Parsing CSS variables…",
  "Parsing Tailwind config…",
  "Extracting 12 token categories…",
  "Scanning assets…",
  "Done. Redirecting…",
];

function ScanningPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { isPreview: ctxPreview } = useOnboarding();
  const repo = params.get("repo");
  const projectName = params.get("projectName");
  const previewInUrl = params.get("preview") === "1";
  const isPreview = previewInUrl || isPreviewOnboardingEnabled() || ctxPreview;
  const [log, setLog] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!repo) {
      router.replace("/onboarding/connect");
      return;
    }

    if (isPreview) {
      if (typeof window !== "undefined") {
        setPreviewOnboarding(true);
      }
      let i = 0;
      const tick = setInterval(() => {
        if (i >= STEPS.length) {
          clearInterval(tick);
          router.replace(
            `/onboarding/complete?preview=1&repo=${encodeURIComponent(repo)}`,
          );
          return;
        }
        setLog((l) => [...l, STEPS[i]]);
        i++;
      }, 700);
      return () => clearInterval(tick);
    }

    const controller = new AbortController();
    void fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lastScanStarted: true,
        clearLastScanError: true,
        currentStep: "scanning",
      }),
    });

    let j = 0;
    const tick = setInterval(() => {
      if (j >= STEPS.length) {
        clearInterval(tick);
        return;
      }
      setLog((l) => [...l, STEPS[j]]);
      j++;
    }, 700);

    (async () => {
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ repo, projectName }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.unsupported) {
            router.replace(
              `/onboarding/unsupported?repo=${encodeURIComponent(repo)}&reason=${encodeURIComponent(body.unsupported)}`,
            );
            return;
          }
          setError(body.error ?? `Scan failed (${res.status})`);
          return;
        }
        const body = await res.json();
        if (body.status === "completed") {
          await router.refresh();
          router.replace("/dashboard");
        } else if (body.unsupported) {
          router.replace(
            `/onboarding/unsupported?repo=${encodeURIComponent(repo)}&reason=${encodeURIComponent(body.unsupported)}`,
          );
        } else {
          setError(body.error ?? "Unknown scan status");
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError((e as Error).message);
        }
      }
    })();

    return () => {
      controller.abort();
      clearInterval(tick);
    };
  }, [repo, router, isPreview, projectName]);

  return (
    <div className="grid min-h-0 min-w-0 flex-1 place-items-center bg-[var(--bg-primary)] px-4 py-8 sm:px-6">
      <div className="w-full min-w-0 max-w-2xl rounded-2xl border-0 bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow-md)] sm:p-8 md:p-10">
        <ProductIcon
          size={32}
          className="autodsm-pulse"
        />
        <h2 className="mt-6 text-h2 text-[var(--text-primary)] break-all">{repo ?? "—"}</h2>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          {isPreview ? "Simulating your brand book load (preview)…" : "Building your brand book."}
        </p>

        <ScanTokenCategoryGrid
          className="mt-6"
          logLength={log.length}
          totalLogSteps={STEPS.length}
        />

        <p className="mt-5 min-h-[1.25em] font-[var(--font-geist-mono)] text-[13px] text-[var(--text-primary)]">
          {error
            ? null
            : log.length > 0
              ? log[log.length - 1]
              : "Starting scan…"}
        </p>

        {error ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border-0 bg-[color-mix(in_srgb,var(--error)_12%,transparent)] p-3 text-[13px] text-[var(--error)] shadow-[var(--shadow-sm)]">
              {error}
            </div>
            <Button asChild variant="outline" className="w-full h-10 rounded-xl">
              <Link href="/onboarding/connect">Edit repository</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            <Progress
              value={Math.min(100, Math.round((log.length / Math.max(STEPS.length, 1)) * 100))}
              className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]"
            />
            <p className="text-[11px] text-[var(--text-tertiary)]">
              Step {Math.min(log.length, STEPS.length)} of {STEPS.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanningPage() {
  return (
    <React.Suspense fallback={null}>
      <ScanningPageInner />
    </React.Suspense>
  );
}
