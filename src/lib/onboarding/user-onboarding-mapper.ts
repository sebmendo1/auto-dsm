import type { OnboardingDraft, OnboardingStepKey } from "./types";

/** Row shape from public.user_onboarding (Supabase). */
export type UserOnboardingRow = {
  user_id: string;
  display_name: string | null;
  personal_website: string | null;
  role: string | null;
  team_size: string | null;
  company_name: string | null;
  company_website: string | null;
  intended_repo_full_name: string | null;
  intended_project_name: string | null;
  current_step: string | null;
  profile_completed_at: string | null;
  last_scan_started_at: string | null;
  last_scan_error: string | null;
  created_at: string;
  updated_at: string;
};

const STEP_KEYS = new Set<string>([
  "welcome",
  "role",
  "team",
  "company",
  "connect",
  "scanning",
]);

function toStepKey(v: string | null): OnboardingStepKey | "" {
  if (!v) return "";
  return STEP_KEYS.has(v) ? (v as OnboardingStepKey) : "";
}

export function userOnboardingRowToDraft(
  row: UserOnboardingRow | null,
): Partial<OnboardingDraft> {
  if (!row) return {};
  return {
    displayName: row.display_name?.trim() ?? "",
    website: row.personal_website?.trim() ?? "",
    companyName: row.company_name?.trim() ?? "",
    companyWebsite: row.company_website?.trim() ?? "",
    role: (row.role as OnboardingDraft["role"]) || "",
    teamSize: (row.team_size as OnboardingDraft["teamSize"]) || "",
    repo: row.intended_repo_full_name?.trim() ?? "",
    projectName: row.intended_project_name?.trim() ?? "",
    currentStep: toStepKey(row.current_step),
  };
}

export function mergeDraftWithServer(
  local: OnboardingDraft,
  row: UserOnboardingRow | null,
): OnboardingDraft {
  if (!row) return local;
  const fromDb = userOnboardingRowToDraft(row);
  return { ...local, ...fromDb };
}

export function isProfileCompleted(row: Pick<UserOnboardingRow, "profile_completed_at"> | null): boolean {
  return Boolean(row?.profile_completed_at);
}
