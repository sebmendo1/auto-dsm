/**
 * Verifies parseGithubThemeFiles triggers only one recursive git tree HTTP request
 * when the three extractors run in parallel (in-flight dedupe in fetcher.getRepoTree).
 */
import assert from "node:assert/strict";

let treeFetchCount = 0;
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : typeof Request !== "undefined" && input instanceof Request
          ? input.url
          : String(input);

  if (url.includes("/git/trees/") && url.includes("recursive=1")) {
    treeFetchCount += 1;
    return new Response(
      JSON.stringify({
        tree: [{ type: "blob", path: "public/mock-asset.png", sha: "abc", size: 10 }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  if (url.match(/api\.github\.com\/repos\/[^/]+\/[^/]+$/) && !url.includes("/git/")) {
    return new Response(JSON.stringify({ default_branch: "main" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return originalFetch(input as RequestInfo, init);
};

const { parseGithubThemeFiles } = await import("../src/lib/parser/github.ts");

treeFetchCount = 0;
await parseGithubThemeFiles("demo-owner/demo-repo");

assert.equal(
  treeFetchCount,
  1,
  `expected exactly 1 recursive tree fetch (parallel extractors deduped), got ${treeFetchCount}`,
);

console.log("ok: parseGithubThemeFiles tree dedupe — 1 fetch");
