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

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_API_TOKEN;
  const h: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "autoDSM/0.1",
  };
  if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
  return h;
}

export async function fetchRepoMeta(
  owner: string,
  name: string,
): Promise<RepoMeta | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}`,
    { headers: authHeaders(), next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  const j = (await res.json()) as {
    default_branch: string;
    html_url: string;
    private: boolean;
  };

  // Resolve HEAD sha of default branch
  const branchRes = await fetch(
    `https://api.github.com/repos/${owner}/${name}/branches/${encodeURIComponent(j.default_branch)}`,
    { headers: authHeaders() },
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
): Promise<{ path: string; sha: string; size: number; type: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/trees/${sha}?recursive=1`,
    { headers: authHeaders() },
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

/** Fetch raw text for a single path (latest on default branch). */
export async function fetchFileText(
  owner: string,
  name: string,
  path: string,
  ref: string,
): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${name}/${ref}/${path}`;
  const res = await fetch(url, { headers: { "User-Agent": "autoDSM/0.1" } });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_TEXT_SIZE) return null;
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(buf);
  } catch {
    return null;
  }
}

/** Fetch raw binary for an asset. */
export async function fetchFileBuffer(
  owner: string,
  name: string,
  path: string,
  ref: string,
): Promise<Buffer | null> {
  const url = `https://raw.githubusercontent.com/${owner}/${name}/${ref}/${path}`;
  const res = await fetch(url, { headers: { "User-Agent": "autoDSM/0.1" } });
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 2_000_000) return null; // skip >2MB images
  return Buffer.from(buf);
}
