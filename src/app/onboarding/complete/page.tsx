"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { setPreviewOnboarding, clearDraft } from "@/lib/onboarding/storage";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function CompleteInner() {
  const params = useSearchParams();
  const isPreview = params.get("preview") === "1";
  const repo = params.get("repo");

  function finish() {
    setPreviewOnboarding(false);
    try {
      clearDraft();
    } catch {
      /* ignore */
    }
  }

  if (!isPreview) {
    return (
      <OnboardingStepCard>
        <Card className="w-full p-8 text-center">
          <p className="text-body-s text-[var(--text-secondary)]">Nothing to see here.</p>
          <Button asChild className="mt-4">
            <Link href="/onboarding/connect">Go to connect</Link>
          </Button>
        </Card>
      </OnboardingStepCard>
    );
  }

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0 text-center">
        <h1 className="text-h1 text-[var(--text-primary)]">Preview complete</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          {repo
            ? `We simulated loading ${repo}. No repository was scanned and no data was written.`
            : "This was a UI-only run. No scan was performed."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
          >
            <Link href="/login" onClick={finish}>
              Back to login
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-xl"
          >
            <Link
              href="/onboarding/welcome?preview=1"
              onClick={() => {
                setPreviewOnboarding(true);
              }}
            >
              Run again
            </Link>
          </Button>
        </div>
      </Card>
    </OnboardingStepCard>
  );
}

export default function OnboardingCompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteInner />
    </Suspense>
  );
}
