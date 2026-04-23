"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { withPreviewParam } from "@/lib/onboarding/routes";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function OnboardingCompanyPage() {
  const router = useRouter();
  const { draft, isPreview, commit } = useOnboarding();
  const [companyName, setCompanyName] = React.useState(draft.companyName);
  const [companyWebsite, setCompanyWebsite] = React.useState(draft.companyWebsite);

  React.useEffect(() => {
    setCompanyName(draft.companyName);
    setCompanyWebsite(draft.companyWebsite);
  }, [draft.companyName, draft.companyWebsite]);

  async function next(e: React.FormEvent) {
    e.preventDefault();
    const n = companyName.trim();
    if (!n) {
      toast.error("Please enter your company name.");
      return;
    }
    const nextDraft = {
      ...draft,
      companyName: n,
      companyWebsite: companyWebsite.trim(),
      currentStep: "connect" as const,
    };
    const ok = await commit(nextDraft, { setProfileComplete: true });
    if (!ok) {
      toast.error("Could not save. Try again.");
      return;
    }
    router.push(withPreviewParam("/onboarding/connect", isPreview));
  }

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0">
        <h1 className="text-h1 text-[var(--text-primary)]">Company information</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          We&apos;ll use this in your brand book and workspace.
        </p>
        <form className="mt-8 flex flex-col gap-4" onSubmit={next}>
          <div>
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Your company
            </label>
            <Input
              className="mt-1.5 h-11 rounded-xl bg-[var(--bg-secondary)]"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Your company website
            </label>
            <Input
              className="mt-1.5 h-11 rounded-xl bg-[var(--bg-secondary)]"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://"
              inputMode="url"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
          >
            Continue
          </Button>
        </form>
      </Card>
    </OnboardingStepCard>
  );
}
