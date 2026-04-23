"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductIcon } from "@/components/brand/product-mark";
import { getAuthBridgePath } from "@/lib/auth/bridge-redirect";
import { isProfileCompleted, type UserOnboardingRow } from "@/lib/onboarding/user-onboarding-mapper";

/**
 * Client-side hop after OAuth. Reads sessionStorage pending repo and routes:
 *   1. If pending repo → /onboarding/scanning?repo=<slug>
 *   2. Else if brand_repos row → /dashboard
 *   3. Else if user_onboarding.profile_completed_at → /onboarding/connect
 *   4. Else → /onboarding/welcome
 */
export default function AuthBridge() {
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem("autodsm.pendingRepo");
        if (pending) sessionStorage.removeItem("autodsm.pendingRepo");
      } catch {
        // ignore
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      if (pending) {
        if (!cancelled) {
          router.replace(
            getAuthBridgePath({
              hasPendingRepo: true,
              pendingRepo: pending,
              hasBrandRepo: false,
              profileCompleted: false,
            }),
          );
        }
        return;
      }

      const { data: brandRow } = await supabase
        .from("brand_repos")
        .select("owner,name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: onboardRow } = await supabase
        .from("user_onboarding")
        .select("profile_completed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      const path = getAuthBridgePath({
        hasPendingRepo: false,
        pendingRepo: null,
        hasBrandRepo: Boolean(brandRow),
        profileCompleted: isProfileCompleted(
          onboardRow as Pick<UserOnboardingRow, "profile_completed_at"> | null,
        ),
      });
      router.replace(path);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-3">
        <ProductIcon size={32} className="autodsm-pulse" />
        <p className="text-body-s text-[var(--text-secondary)]">Signing you in…</p>
      </div>
    </div>
  );
}
