/**
 * Pure logic for /auth/bridge post-OAuth redirect (used by the bridge page and tests).
 */
export type AuthBridgeInput = {
  hasPendingRepo: boolean;
  /** owner/name from sessionStorage, already decoded */
  pendingRepo: string | null;
  hasBrandRepo: boolean;
  /** user_onboarding.profile_completed_at is set (company step saved) */
  profileCompleted: boolean;
};

export function getAuthBridgePath(input: AuthBridgeInput): string {
  if (input.hasPendingRepo && input.pendingRepo) {
    const q = new URLSearchParams({ repo: input.pendingRepo });
    return `/onboarding/scanning?${q.toString()}`;
  }
  if (input.hasBrandRepo) {
    return "/dashboard";
  }
  if (input.profileCompleted) {
    return "/onboarding/connect";
  }
  return "/onboarding/welcome";
}
