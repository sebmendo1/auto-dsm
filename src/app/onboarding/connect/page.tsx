"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { OnboardingStepCard } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { normalizeRepoInput } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RepoOption = { full_name: string; private: boolean };

export default function OnboardingConnectPage() {
  const router = useRouter();
  const { draft, isPreview, commit } = useOnboarding();
  const [value, setValue] = React.useState(draft.repo || "");
  const [submitting, setSubmitting] = React.useState(false);
  const [provider, setProvider] = React.useState<"github" | "google" | null>(null);
  const [repos, setRepos] = React.useState<RepoOption[]>([]);
  const [reposLoading, setReposLoading] = React.useState(false);
  const [reposHint, setReposHint] = React.useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = React.useState(false);

  React.useEffect(() => {
    if (draft.repo) setValue(draft.repo);
  }, [draft.repo]);

  React.useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const appMetaProvider =
        (user?.app_metadata?.provider as string | undefined) ?? null;
      if (appMetaProvider === "github") setProvider("github");
      else if (appMetaProvider === "google") setProvider("google");
    });
  }, []);

  React.useEffect(() => {
    if (provider !== "github" || isPreview) return;
    let cancelled = false;
    setReposLoading(true);
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then(
        (body: {
          repos?: RepoOption[];
          needsGitHubReauth?: boolean;
          message?: string;
          error?: string;
        }) => {
          if (cancelled) return;
          setRepos(body.repos ?? []);
          setNeedsReauth(Boolean(body.needsGitHubReauth));
          if (body.message) setReposHint(body.message);
          else if (body.error) setReposHint(body.error);
          else setReposHint(null);
        },
      )
      .catch(() => {
        if (!cancelled) setReposHint("Could not load repositories. Paste owner/repo below.");
      })
      .finally(() => {
        if (!cancelled) setReposLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, isPreview]);

  const filteredRepos = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [repos, value]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeRepoInput(value);
    if (!normalized) {
      toast.error("Choose a repository or enter owner/repo or a github.com URL.");
      return;
    }
    const [, name] = normalized.split("/");
    const projectName =
      draft.projectName?.trim() ||
      draft.companyName.trim() ||
      name ||
      "Project";
    setSubmitting(true);
    const nextDraft = {
      ...draft,
      repo: normalized,
      projectName,
      currentStep: "scanning" as const,
    };
    const ok = isPreview
      ? true
      : await commit(nextDraft, { clearLastScanError: true });
    setSubmitting(false);
    if (!ok) {
      toast.error("Could not save your selection. Try again.");
      return;
    }
    const q = new URLSearchParams({
      repo: normalized,
      projectName,
    });
    if (isPreview) q.set("preview", "1");
    router.push(`/onboarding/scanning?${q.toString()}`);
  }

  const datalistId = "autodsm-github-repo-suggestions";

  return (
    <OnboardingStepCard>
      <Card className="w-full p-6 sm:p-8 md:p-10 shadow-[var(--shadow-md)] border-0">
        <h1 className="text-h1 text-[var(--text-primary)]">Connect a repository</h1>
        <p className="mt-2 text-body-s text-[var(--text-secondary)]">
          {isPreview
            ? "Preview mode: enter a public owner/repo. The scan step will simulate progress only."
            : provider === "github"
              ? "We’ve pulled repositories from your GitHub account when available. You can render any of these with autoDSM — or paste your own below."
              : "Paste a GitHub URL or owner/repo. Sign in with GitHub (and approve repo access) to list repositories and scan private code."}
        </p>

        {provider === "github" && !isPreview && (
          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--text-tertiary)]">
              <span>Your GitHub repositories</span>
              {reposLoading ? (
                <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
              ) : (
                <span>{repos.length ? `${repos.length} found` : "—"}</span>
              )}
            </div>
            {reposHint ? (
              <p className="mt-2 text-[12px] leading-[16px] text-[var(--text-secondary)]">
                {reposHint}
              </p>
            ) : null}
            {needsReauth ? (
              <div className="mt-2 space-y-2">
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  After signing in again, return here to see the list — or paste a repo slug now.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.assign("/auth/oauth?provider=github");
                  }}
                >
                  Use GitHub for repo list
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {isPreview && (
          <div
            className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[12px] text-[var(--text-secondary)]"
            role="status"
          >
            Repository list is unavailable without GitHub sign-in. Use a public{" "}
            <code className="text-[var(--text-primary)]">owner/repo</code> to preview the flow.
          </div>
        )}

        {provider === "github" && repos.length > 0 && !isPreview ? (
          <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2 [scrollbar-width:thin]">
            {filteredRepos.slice(0, 16).map((r) => (
              <li key={r.full_name}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-2 py-2 text-left text-[13px] [font-family:var(--font-geist-sans)] [transition:background_0.15s_var(--ease-standard)]",
                    value === r.full_name
                      ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
                  )}
                  onClick={() => setValue(r.full_name)}
                >
                  {r.full_name}
                  <span className="ml-2 text-[var(--text-tertiary)]">
                    {r.private ? "private" : "public"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <form className="mt-6 flex flex-col gap-3" onSubmit={submit}>
          {provider === "github" && repos.length > 0 && !isPreview ? (
            <>
              <label className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                or paste
              </label>
              <Input
                placeholder="Search or type owner/repo…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                list={datalistId}
                className="h-11 rounded-xl text-[14px] bg-[var(--bg-secondary)]"
                autoComplete="off"
                autoFocus
              />
              <datalist id={datalistId}>
                {filteredRepos.map((r) => (
                  <option key={r.full_name} value={r.full_name}>
                    {r.private ? "private" : "public"}
                  </option>
                ))}
              </datalist>
            </>
          ) : (
            <Input
              placeholder="vercel/next.js or github.com/owner/repo"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 rounded-xl text-[14px] bg-[var(--bg-secondary)]"
              autoFocus
            />
          )}
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
          >
            {submitting ? "Saving…" : "Continue"}
            <ArrowRight size={15} strokeWidth={1.8} className="ml-1" />
          </Button>
        </form>

        {provider !== "github" && !isPreview && (
          <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
            <a
              href="https://github.com/apps/autodsm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] [transition:color_0.15s_var(--ease-standard)]"
            >
              <Github size={14} strokeWidth={1.5} />
              Install autoDSM on GitHub
            </a>
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              Required for private repositories.
            </p>
          </div>
        )}
      </Card>
    </OnboardingStepCard>
  );
}
