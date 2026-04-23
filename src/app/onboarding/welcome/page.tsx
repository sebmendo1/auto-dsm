"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { withPreviewParam } from "@/lib/onboarding/routes";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { draft, update, isPreview, commit } = useOnboarding();
  const [name, setName] = React.useState(draft.displayName);
  const [website, setWebsite] = React.useState(draft.website);

  React.useEffect(() => {
    setName(draft.displayName);
    setWebsite(draft.website);
  }, [draft.displayName, draft.website]);

  React.useEffect(() => {
    if (draft.displayName) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fromMeta =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.user_name as string) ||
        "";
      if (fromMeta) {
        setName(fromMeta);
        update({ displayName: fromMeta });
      }
    });
  }, [draft.displayName, update]);

  async function continueNext(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      toast.error("Please enter your name.");
      return;
    }
    const next = {
      ...draft,
      displayName: n,
      website: website.trim(),
      currentStep: "role" as const,
    };
    const ok = await commit(next);
    if (!ok) {
      toast.error("Could not save your profile. Check your connection and try again.");
      return;
    }
    router.push(withPreviewParam("/onboarding/role", isPreview));
  }

  const displayLabel = name.trim() || "there";

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0">
        <h1 className="text-h1 text-[var(--text-primary)]">Welcome {displayLabel}!</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          We&apos;ll help you render your design system right away. Before we start, please
          confirm your information.
        </p>
        <form className="mt-8 flex flex-col gap-4" onSubmit={continueNext}>
          <div>
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Your name
            </label>
            <Input
              className="mt-1.5 h-11 rounded-xl bg-[var(--bg-secondary)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[var(--text-tertiary)]">
              Your company website
            </label>
            <Input
              className="mt-1.5 h-11 rounded-xl bg-[var(--bg-secondary)]"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              inputMode="url"
              autoComplete="url"
            />
          </div>
          <Button type="submit" size="lg" className="mt-2 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90">
            Continue
          </Button>
        </form>
      </Card>
    </OnboardingStepCard>
  );
}
