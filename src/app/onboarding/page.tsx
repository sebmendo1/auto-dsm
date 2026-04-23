import { redirect } from "next/navigation";

/**
 * Legacy `/onboarding` — use the first wizard step.
 */
export default function OnboardingIndex() {
  redirect("/onboarding/account");
}
