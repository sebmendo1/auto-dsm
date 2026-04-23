import "server-only";

export interface RepoMeta {
  owner: string;
  name: string;
  defaultBranch: string;
  sha: string; // HEAD SHA of default branch
  url: string;
  private: boolean;
}

export interface RepoFile {
  path: string;
  sha: string;
  size: number;
  /** Utf-8 text content — null for binary / too-large files (> 1 MB). */
  content: string | null;
  /** Raw buffer if downloaded (small binaries only, for asset processing). */
  buffer?: Buffer | null;
}

const MAX_TEXT_SIZE = 1_000_000; // 1MB

export type GitHubFetchOptions = {
  /**
   * User's GitHub OAuth access token from Supabase `session.provider_token`
   * (only present for GitHub sign-in). Used for private repos and higher rate limits.
   */
  userAccessToken?: string | null;
};

function apiHeaders(opts?: GitHubFetchOptions): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "autoDSM/0.1",
  };
  if (opts?.userAccessToken) {
    h.Authorization = `Bearer ${opts.userAccessToken}`;
  } else if (process.env.GITHUB_API_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_API_TOKEN}`;
  }
  return h;
}

function rawHeaders(opts?: GitHubFetchOptions): HeadersInit {
  const h: Record<string, string> = { "User-Agent": "autoDSM/0.1" };
  if (opts?.userAccessToken) {
    h.Authorization = `Bearer ${opts.userAccessToken}`;
  } else if (process.env.GITHUB_API_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_API_TOKEN}`;
  }
  return h;
}

function encPath(p: string): string {
  return p
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}

/** GET /repos/{o}/{n}/contents/{path} for file/blob at ref (private-safe). */
async function fetchFileContentsApi(
  owner: string,
  name: string,
  path: string,
  ref: string,
  opts?: GitHubFetchOptions,
): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${name}/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, { headers: apiHeaders(opts), next: { revalidate: 0 } });
  if (!res.ok) return null;
  const j = (await res.json()) as { content?: string; encoding?: string; size?: number };
  if (j.encoding !== "base64" || !j.content) return null;
  if (j.size && j.size > MAX_TEXT_SIZE) return null;
  try {
    const buf = Buffer.from(j.content.replace(/\n/g, ""), "base64");
    if (buf.byteLength > MAX_TEXT_SIZE) return null;
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } catch {
    return null;
  }
}

export async function fetchRepoMeta(
  owner: string,
  name: string,
  opts?: GitHubFetchOptions,
): Promise<RepoMeta | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: apiHeaders(opts),
    next: { revalidate: 60 },
  });
  if (res.status === 403) return null;
  if (!res.ok) return null;
  const j = (await res.json()) as {
    default_branch: string;
    html_url: string;
    private: boolean;
  };

  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${name}/branches/${encodeURIComponent(j.default_branch)}`,
    { headers: apiHeaders(opts) },
  );
  if (!branchRes.ok) return null;
  const branchData = (await branchRes.json()) as { commit: { sha: string } };

  return {
    owner,
    name,
    defaultBranch: j.default_branch,
    sha: branchData.commit.sha,
    url: j.html_url,
    private: j.private,
  };
}

export async function fetchTree(
  owner: string,
  name: string,
  sha: string,
  opts?: GitHubFetchOptions,
): Promise<{ path: string; sha: string; size: number; type: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/trees/${sha}?recursive=1`,
    { headers: apiHeaders(opts) },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as {
    tree: { path: string; sha: string; size?: number; type: string }[];
    truncated?: boolean;
  };
  return j.tree
    .filter((t) => t.type === "blob")
    .map((t) => ({ path: t.path, sha: t.sha, size: t.size ?? 0, type: t.type }));
}

/**
 * Raw.githubusercontent first (fast for public), then contents API
 * (needed for many private-repo cases when using OAuth token).
 */
export async function fetchFileText(
  owner: string,
  name: string,
  path: string,
  ref: string,
  opts?: GitHubFetchOptions,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${name}/${ref}/${encPath(path)}`;
  const res = await fetch(url, { headers: rawHeaders(opts) });
  if (res.ok) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_TEXT_SIZE) return null;
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(buf);
    } catch {
      return null;
    }
  }
  if (res.status === 404 && opts?.userAccessToken) {
    return fetchFileContentsApi(owner, name, path, ref, opts);
  }
  if (opts?.userAccessToken) {
    const fromApi = await fetchFileContentsApi(owner, name, path, ref, opts);
    if (fromApi) return fromApi;
  }
  return null;
}

export async function fetchFileBuffer(
  owner: string,
  name: string,
  path: string,
  ref: string,
  opts?: GitHubFetchOptions,
): Promise<Buffer | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${name}/${ref}/${encPath(path)}`;
  const res = await fetch(url, { headers: rawHeaders(opts) });
  if (res.ok) {
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2_000_000) return null;
    return Buffer.from(buf);
  }
  if (opts?.userAccessToken) {
    const t = await fetchFileContentsApi(owner, name, path, ref, opts);
    if (t) {
      return Buffer.from(t, "utf-8");
    }
  }
  return null;
}
