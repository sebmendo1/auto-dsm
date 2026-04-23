import type { OnboardingDraft } from "./types";
import { emptyDraft } from "./types";

const DRAFT_KEY = "autodsm.onboarding.v1";
const PREVIEW_KEY = "autodsm.onboardingPreview";

export function loadDraft(): OnboardingDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    return { ...emptyDraft(), ...parsed };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(partial: Partial<OnboardingDraft>) {
  if (typeof window === "undefined") return;
  const next = { ...loadDraft(), ...partial };
  persistEntire(next);
}

/** Replace full draft in sessionStorage (use with React setState to avoid partial races). */
export function persistEntire(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore quota */
  }
}

export function isPreviewOnboardingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPreviewOnboarding(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(PREVIEW_KEY, "1");
    else sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    /* ignore */
  }
}

export function readPreviewFromQuery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("preview") === "1";
  } catch {
    return false;
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
