/** Append `preview=1` to onboarding URLs for dev UI preview. */
export function withPreviewParam(path: string, isPreview: boolean): string {
  if (!isPreview) return path;
  const u = new URL(path, "http://_");
  u.searchParams.set("preview", "1");
  return u.pathname + u.search;
}
