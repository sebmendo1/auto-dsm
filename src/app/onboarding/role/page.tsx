"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { withPreviewParam } from "@/lib/onboarding/routes";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROLE_OPTIONS, type OnboardingRole } from "@/lib/onboarding/types";
import { toast } from "sonner";

export default function OnboardingRolePage() {
  const router = useRouter();
  const { draft, isPreview, commit } = useOnboarding();
  const [role, setRole] = React.useState<OnboardingRole | Exclude<OnboardingRole, "">>(
    (draft.role as OnboardingRole) || "",
  );

  React.useEffect(() => {
    if (draft.role) setRole(draft.role);
  }, [draft.role]);

  async function next() {
    if (!role) {
      toast.error("Select a role.");
      return;
    }
    const nextDraft = { ...draft, role, currentStep: "team" as const };
    const ok = await commit(nextDraft);
    if (!ok) {
      toast.error("Could not save. Try again.");
      return;
    }
    router.push(withPreviewParam("/onboarding/team", isPreview));
  }

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0">
        <h1 className="text-h1 text-[var(--text-primary)]">What&apos;s your role?</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          We use this to tailor your experience.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-[14px] font-medium [font-family:var(--font-geist-sans)] [transition:background_0.15s_var(--ease-standard),border-color_0.15s_var(--ease-standard),color_0.15s_var(--ease-standard)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple-600)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]",
                role === r.value
                  ? "border-[var(--purple-600)] bg-[color-mix(in_srgb,var(--purple-600)_16%,var(--bg-elevated))] text-[var(--text-primary)]"
                  : "border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-secondary)]",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="lg"
          className="mt-10 w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
          onClick={next}
        >
          Continue
        </Button>
      </Card>
    </OnboardingStepCard>
  );
}
