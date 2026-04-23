import type { OnboardingDraft } from "./types";

/** JSON body for PATCH /api/onboarding (see route zod). */
export type OnboardingServerPatch = {
  displayName?: string;
  website?: string;
  companyName?: string;
  companyWebsite?: string;
  role?: string;
  teamSize?: string;
  repo?: string;
  projectName?: string;
  currentStep?: string;
  setProfileComplete?: boolean;
  lastScanStarted?: boolean;
  lastScanError?: string | null;
  clearLastScanError?: boolean;
};

export function draftToServerPatch(d: OnboardingDraft): OnboardingServerPatch {
  return {
    displayName: d.displayName,
    website: d.website,
    companyName: d.companyName,
    companyWebsite: d.companyWebsite,
    role: d.role,
    teamSize: d.teamSize,
    repo: d.repo,
    projectName: d.projectName,
    currentStep: d.currentStep,
  };
}

export function mergePatch(
  base: OnboardingServerPatch,
  extras: OnboardingServerPatch,
): OnboardingServerPatch {
  return { ...base, ...extras };
}
