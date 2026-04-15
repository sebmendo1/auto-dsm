/** Canonical demo workspace — never call live GitHub discover for this repo. */
export const DEMO_REPO_FULL_NAME = "demo/showcase" as const;

export function isDemoDataEnabled(): boolean {
  return import.meta.env.VITE_USE_DEMO_DATA === "true";
}

export function isDemoRepo(repo: string | null | undefined): boolean {
  if (!repo) return false;
  return repo === DEMO_REPO_FULL_NAME || repo.startsWith("demo/");
}
