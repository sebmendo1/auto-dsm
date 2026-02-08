import { discoverComponents } from "../lib/github/component-discovery";

interface RepoItem {
  full_name: string;
}

interface RepoSearchResponse {
  items: RepoItem[];
}

const DEFAULT_QUERY = "react in:name,description,topics";

async function fetchRepos(query: string, token?: string) {
  const params = new URLSearchParams({
    q: query,
    sort: "stars",
    order: "desc",
    per_page: "100",
  });

  const res = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub search failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as RepoSearchResponse;
  return data.items.map((item) => item.full_name);
}

async function runPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

function summarize(counts: number[]) {
  const sorted = [...counts].sort((a, b) => a - b);
  const sum = counts.reduce((acc, value) => acc + value, 0);
  const avg = sum / counts.length;
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  return {
    totalRepos: counts.length,
    avg: Math.round(avg * 100) / 100,
    median,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const query = args.find((arg) => arg.startsWith("--query="))?.replace("--query=", "") ?? DEFAULT_QUERY;
  const concurrency = Number(
    args.find((arg) => arg.startsWith("--concurrency="))?.replace("--concurrency=", "") ?? 2,
  );
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("No GITHUB_TOKEN set. You may hit GitHub rate limits.");
  }

  console.log(`Fetching repos for query: ${query}`);
  const repos = await fetchRepos(query, token);
  console.log(`Found ${repos.length} repos. Testing component discovery...`);

  const results = await runPool(repos, concurrency, async (fullName, idx) => {
    const [owner, repo] = fullName.split("/");
    try {
      const result = await discoverComponents(owner, repo, token);
      const count = result.components.length;
      console.log(`[${idx + 1}/${repos.length}] ${fullName}: ${count} components`);
      return { repo: fullName, count, componentPaths: result.componentPaths };
    } catch (error) {
      console.warn(`[${idx + 1}/${repos.length}] ${fullName}: failed (${(error as Error).message})`);
      return { repo: fullName, count: 0, componentPaths: [], error: (error as Error).message };
    }
  });

  const counts = results.map((item) => item.count);
  const summary = summarize(counts);

  console.log("\nSummary");
  console.log(summary);

  const failures = results.filter((item) => (item as any).error);
  if (failures.length > 0) {
    console.log(`\nFailures (${failures.length})`);
    failures.slice(0, 10).forEach((fail) => {
      console.log(`- ${fail.repo}: ${(fail as any).error}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
