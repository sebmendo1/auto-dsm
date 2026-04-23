"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { OnboardingDraft } from "@/lib/onboarding/types";
import { emptyDraft } from "@/lib/onboarding/types";
import { mergeDraftWithServer, type UserOnboardingRow } from "@/lib/onboarding/user-onboarding-mapper";
import {
  draftToServerPatch,
  mergePatch,
  type OnboardingServerPatch,
} from "@/lib/onboarding/persist";
import {
  loadDraft,
  persistEntire,
  clearDraft as clearDraftStorage,
  isPreviewOnboardingEnabled,
  setPreviewOnboarding,
  readPreviewFromQuery,
} from "@/lib/onboarding/storage";

type Ctx = {
  draft: OnboardingDraft;
  update: (partial: Partial<OnboardingDraft>) => void;
  isPreview: boolean;
  clearDraft: () => void;
  /** True after first attempt to load from GET /api/onboarding (or immediately in preview). */
  serverSynced: boolean;
  /**
   * Replaces the draft, persists to sessionStorage, and PATCHes the server (skipped in preview).
   * Returns whether the network save succeeded.
   */
  commit: (next: OnboardingDraft, extras?: OnboardingServerPatch) => Promise<boolean>;
};

const OnboardingContext = React.createContext<Ctx | null>(null);

export function useOnboarding() {
  const c = React.useContext(OnboardingContext);
  if (!c) {
    throw new Error("useOnboarding must be used under OnboardingProvider");
  }
  return c;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [draft, setDraft] = React.useState<OnboardingDraft>(emptyDraft);
  const [isPreview, setIsPreview] = React.useState(false);
  const [serverSynced, setServerSynced] = React.useState(false);

  React.useEffect(() => {
    setDraft(loadDraft());
    if (readPreviewFromQuery()) setPreviewOnboarding(true);
    setIsPreview(isPreviewOnboardingEnabled() || readPreviewFromQuery());
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPreviewOnboardingEnabled() || readPreviewFromQuery()) {
      setServerSynced(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/onboarding", { method: "GET" });
      if (cancelled) return;
      if (res.status === 401) {
        setServerSynced(true);
        return;
      }
      if (!res.ok) {
        setServerSynced(true);
        return;
      }
      const json = (await res.json()) as { onboarding: UserOnboardingRow | null };
      const local = loadDraft();
      const merged = mergeDraftWithServer(local, json.onboarding);
      setDraft(merged);
      persistEntire(merged);
      setServerSynced(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = React.useCallback((partial: Partial<OnboardingDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...partial };
      persistEntire(next);
      return next;
    });
  }, []);

  const clearDraft = React.useCallback(() => {
    clearDraftStorage();
    setDraft(emptyDraft());
  }, []);

  const commit = React.useCallback(
    async (next: OnboardingDraft, extras?: OnboardingServerPatch) => {
      if (isPreview) {
        setDraft(next);
        persistEntire(next);
        return true;
      }
      setDraft(next);
      persistEntire(next);
      const body = mergePatch(draftToServerPatch(next), extras ?? {});
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    },
    [isPreview],
  );

  const value = React.useMemo<Ctx>(
    () => ({
      draft,
      update,
      isPreview,
      clearDraft,
      serverSynced,
      commit,
    }),
    [draft, update, isPreview, clearDraft, serverSynced, commit],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}
