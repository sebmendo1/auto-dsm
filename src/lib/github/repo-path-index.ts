import type { Octokit } from "octokit";

export type RepoPathIndex = {
  paths: string[];
  blobs: Array<{ path: string; size?: number }>;
  defaultBranch: string;
  /** Tip of the resolved branch (commit SHA); used for cache keys. */
  commitSha: string;
};

type CacheEntry = { index: RepoPathIndex; expiresAt: number };

const TTL_MS = 3 * 60 * 1000;
const cacheByCommit = new Map<string, CacheEntry>();
const cacheByBranchKey = new Map<string, CacheEntry>();

function cacheKeys(owner: string, repo: string, defaultBranch: string, commitSha: string) {
  return {
    commit: `${owner}/${repo}@${commitSha}`,
    branch: `${owner}/${repo}:heads/${defaultBranch}`,
  };
}

/**
 * Loads full recursive tree path list for a repo, with short TTL in-memory dedupe on the server.
 */
export async function getRepoPathIndex(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch?: string,
): Promise<RepoPathIndex> {
  let targetBranch = branch;

  if (!targetBranch) {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    targetBranch = repoData.default_branch;
  }

  let commitSha: string;
  try {
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${targetBranch}`,
    });
    commitSha = ref.object.sha;
  } catch (error: unknown) {
    const err = error as { status?: number };
    if (err.status === 404 && targetBranch === "main") {
      return getRepoPathIndex(octokit, owner, repo, "master");
    }
    throw error;
  }

  const { commit, branch: branchKey } = cacheKeys(owner, repo, targetBranch, commitSha);

  const now = Date.now();
  const commitHit = cacheByCommit.get(commit);
  if (commitHit && commitHit.expiresAt > now) {
    return commitHit.index;
  }

  const { data: tree } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: "true",
  });

  const blobs: Array<{ path: string; size?: number }> = [];
  for (const item of tree.tree ?? []) {
    if (item.type === "blob" && item.path) {
      blobs.push({
        path: item.path,
        size: typeof item.size === "number" ? item.size : undefined,
      });
    }
  }

  const index: RepoPathIndex = {
    paths: blobs.map((b) => b.path),
    blobs,
    defaultBranch: targetBranch,
    commitSha,
  };

  const entry: CacheEntry = { index, expiresAt: now + TTL_MS };
  cacheByCommit.set(commit, entry);
  cacheByBranchKey.set(branchKey, entry);

  return index;
}
