/**
 * Local development only: preview the authenticated dashboard without Supabase session
 * or a scanned repo. Never active when NODE_ENV is production.
 */

export function isDevAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

/**
 * Repo slug for the demo BrandProfile (e.g. "vercel/next.js").
 * Change in .env.local and restart `npm run dev` to test different labels.
 */
export function getDevPreviewRepoSlug(): string {
  const raw = process.env.DEV_PREVIEW_REPO?.trim();
  if (raw && raw.includes("/")) {
    return raw.replace(/^\/+|\/+$/g, "");
  }
  return "demo/local-preview";
}
