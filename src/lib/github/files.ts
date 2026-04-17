/**
 * Minimal GitHub fetcher. We call api.github.com unauthenticated for public
 * repos (60 req/hr per IP) and fall back to GITHUB_API_TOKEN if provided.
 *
 * The scan pipeline does a single tree fetch + up to N parallel file reads.
 * N is capped to stay under rate limits.
 */

interface Env {
  token?: string;
}

interface RepoRef {
  owner: string;
  name: string;
  branch?: string;
}

export class GitHubClient {
  private env: Env;
  constructor(env: Env = {}) {
    this.env = { token: env.token ?? process.env.GITHUB_API_TOKEN };
  }

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'autodsm/0.1',
    };
    if (this.env.token) h.Authorization = `Bearer ${this.env.token}`;
    return h;
  }

  async getDefaultBranch(repo: RepoRef): Promise<string> {
    const r = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}`, {
      headers: this.headers(),
      next: { revalidate: 60 },
    });
    if (!r.ok) throw new Error(`GitHub repo not found: ${repo.owner}/${repo.name} (${r.status})`);
    const data = await r.json();
    return data.default_branch as string;
  }

  async getTree(repo: RepoRef): Promise<{ path: string; type: string; sha: string; size?: number }[]> {
    const branch = repo.branch ?? (await this.getDefaultBranch(repo));
    const r = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${branch}?recursive=1`,
      { headers: this.headers(), next: { revalidate: 60 } },
    );
    if (!r.ok) throw new Error(`GitHub tree fetch failed: ${r.status}`);
    const data = await r.json();
    return data.tree as { path: string; type: string; sha: string; size?: number }[];
  }

  async getFile(repo: RepoRef, path: string, branch?: string): Promise<string> {
    const ref = branch ?? repo.branch ?? (await this.getDefaultBranch(repo));
    // Use the raw content API — cheaper than the blob JSON + base64.
    const r = await fetch(
      `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${ref}/${path}`,
      { next: { revalidate: 60 } },
    );
    if (!r.ok) throw new Error(`File not found: ${path} (${r.status})`);
    return await r.text();
  }

  async getCommits(repo: RepoRef, limit = 6): Promise<{
    sha: string; message: string; author: string; date: string; url: string;
  }[]> {
    const r = await fetch(
      `https://api.github.com/repos/${repo.owner}/${repo.name}/commits?per_page=${limit}`,
      { headers: this.headers(), next: { revalidate: 300 } },
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      html_url: string;
    }>).map((c) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0],
      author: c.commit.author?.name ?? '',
      date: c.commit.author?.date ?? '',
      url: c.html_url,
    }));
  }
}

// ─── URL helpers ───────────────────────────────────────────────────────────

const URL_PATTERNS = [
  /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/,
  /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/,
];

export function parseRepoIdentifier(input: string): RepoRef | null {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  for (const p of URL_PATTERNS) {
    const m = trimmed.match(p);
    if (m) return { owner: m[1], name: m[2] };
  }
  return null;
}
