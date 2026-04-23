import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_PAGES = 3;
const PER_PAGE = 100;

/**
 * Lists repositories the signed-in user can access (GitHub OAuth token).
 * Requires GitHub sign-in with scopes that include listing repos (see /auth/oauth).
 * Fetches up to MAX_PAGES of results (per_page=100 each) and merges.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    return NextResponse.json({
      repos: [] as { full_name: string; private: boolean }[],
      needsGitHubReauth: true,
      message:
        "Sign out and sign in with GitHub again to load your repository list (updated OAuth permissions). You can still paste any public owner/repo below.",
    });
  }

  const all: { full_name: string; private: boolean }[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${session.provider_token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 0 },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        {
          repos: all,
          error: `GitHub returned ${res.status}`,
          detail: text.slice(0, 300),
          pagesLoaded: page - 1,
        },
        { status: 200 },
      );
    }
    const data = (await res.json()) as Array<{ full_name: string; private: boolean }>;
    const pageRows = (Array.isArray(data) ? data : []).map((r) => ({
      full_name: r.full_name,
      private: Boolean(r.private),
    }));
    for (const r of pageRows) {
      if (!seen.has(r.full_name)) {
        seen.add(r.full_name);
        all.push(r);
      }
    }
    if (pageRows.length < PER_PAGE) break;
  }

  return NextResponse.json({ repos: all, pagesLoaded: Math.min(MAX_PAGES, Math.ceil(all.length / PER_PAGE) || 1) });
}
