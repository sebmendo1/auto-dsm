"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { withPreviewParam } from "@/lib/onboarding/routes";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { GithubGlyph, GoogleGlyph } from "@/components/auth/oauth-glyphs";

const SUPABASE_SETUP =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a public key, then restart the dev server.";

export default function OnboardingAccountPage() {
  const router = useRouter();
  const { isPreview } = useOnboarding();
  const [loading, setLoading] = React.useState<"github" | "google" | null>(null);
  const supabaseReady = React.useMemo(() => isSupabasePublicConfigured(), []);

  React.useEffect(() => {
    if (isPreview) {
      router.replace(withPreviewParam("/onboarding/welcome", true));
      return;
    }
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/onboarding/welcome");
      }
    });
  }, [isPreview, router]);

  function signIn(provider: "github" | "google") {
    if (!supabaseReady) {
      toast.error(SUPABASE_SETUP);
      return;
    }
    setLoading(provider);
    window.location.assign(`/auth/oauth?provider=${encodeURIComponent(provider)}`);
  }

  if (isPreview) {
    return null;
  }

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0">
        <h1 className="text-h1 text-[var(--text-primary)]">Create your account</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          Start building your branding system.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 h-12 rounded-xl"
            onClick={() => signIn("github")}
            disabled={loading !== null || !supabaseReady}
          >
            <GithubGlyph />
            {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-12 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-canvas)] dark:bg-[var(--bg-secondary)] dark:hover:bg-[var(--bg-tertiary)]"
            onClick={() => signIn("google")}
            disabled={loading !== null || !supabaseReady}
          >
            <GoogleGlyph />
            {loading === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>
        </div>
        <p className="mt-8 text-[12px] text-[var(--text-tertiary)] text-center sm:text-left">
          Already have an account?{" "}
          <Link
            href="/login?mode=login"
            className="text-[var(--text-primary)] font-medium underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </p>
      </Card>
    </OnboardingStepCard>
  );
}
