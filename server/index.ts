import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Octokit } from "octokit";
import { discoverComponents } from "../src/lib/github/component-discovery";
import { fetchComponentWorkbenchGraph } from "../src/lib/github/fetch-component-graph";
import { buildRepoAssetsFromTreeBlobs } from "../src/lib/github/image-assets-from-paths";
import { getRepoPathIndex } from "../src/lib/github/repo-path-index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

app.get("/api/github/repo-assets", async (req, res) => {
  try {
    const repoFullName = req.query.repo as string | undefined;
    if (!repoFullName || !repoFullName.includes("/")) {
      res.status(400).json({ error: "Invalid repo. Use: owner/repo" });
      return;
    }

    const [owner, repoName] = repoFullName.split("/");
    if (!owner || !repoName) {
      res.status(400).json({ error: "Invalid repo. Use: owner/repo" });
      return;
    }

    const octokit = new Octokit(process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {});
    const index = await getRepoPathIndex(octokit, owner, repoName);
    const assets = buildRepoAssetsFromTreeBlobs(
      index.blobs,
      owner,
      repoName,
      index.defaultBranch,
    );

    res.json({
      assets,
      defaultBranch: index.defaultBranch,
      commitSha: index.commitSha,
    });
  } catch (error: unknown) {
    console.error("Repo assets error:", error);
    const err = error as { status?: number; message?: string };

    if (err.status === 404) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }

    res.status(500).json({
      error: err.message || "Failed to list assets",
    });
  }
});

app.post("/api/github/discover-components", async (req, res) => {
  const started = Date.now();
  try {
    const { repoFullName } = req.body as { repoFullName?: string };

    if (!repoFullName || !repoFullName.includes("/")) {
      res.status(400).json({ error: "Invalid repo. Use: owner/repo" });
      return;
    }

    const [owner, repo] = repoFullName.split("/");
    console.log(`[auto-dsm] discover-components start repo=${repoFullName}`);

    const result = await discoverComponents(owner, repo, process.env.GITHUB_TOKEN);

    const ms = Date.now() - started;
    const paths = result.componentPaths?.length ?? 0;
    const count = result.totalCount ?? result.components?.length ?? 0;
    console.log(
      `[auto-dsm] discover-components ok repo=${repoFullName} branch=${result.defaultBranch ?? "?"} paths=${paths} components=${count} ${ms}ms`,
    );

    res.json(result);
  } catch (error: unknown) {
    const ms = Date.now() - started;
    const err = error as { status?: number; message?: string };
    console.error(`[auto-dsm] discover-components fail after ${ms}ms`, error);

    if (err.status === 404) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }

    if (err.status === 403) {
      res.status(503).json({
        error:
          err.message ||
          "GitHub API rate limit or access denied (403). Try again later or use a token for higher limits.",
      });
      return;
    }

    res.status(500).json({
      error: err.message || "Discovery failed",
    });
  }
});

app.get("/api/components/:slug", async (req, res) => {
  try {
    void req.params.slug;
    const repo = req.query.repo as string | undefined;
    const filePath = req.query.filePath as string | undefined;
    const branch = typeof req.query.branch === "string" ? req.query.branch : undefined;
    let extraRepoPaths: string[] = [];
    const stylePathsRaw = req.query.stylePaths;
    if (typeof stylePathsRaw === "string" && stylePathsRaw.length > 0) {
      try {
        const parsed = JSON.parse(stylePathsRaw) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          extraRepoPaths = parsed as string[];
        }
      } catch {
        // ignore invalid stylePaths
      }
    }

    if (!repo || !filePath) {
      res.status(400).json({ error: "Missing repo or filePath" });
      return;
    }

    const [owner, repoName] = repo.split("/");

    const graph = await fetchComponentWorkbenchGraph(owner, repoName, filePath, process.env.GITHUB_TOKEN, {
      branch,
      extraRepoPaths,
    });

    res.json({
      name: graph.name,
      filePath: graph.filePath,
      source: graph.source,
      dependencies: graph.dependencies,
      hasDefaultExport: graph.hasDefaultExport,
      exportName: graph.exportName,
      virtualRepoFiles: graph.virtualRepoFiles,
      globalCssRepoPaths: graph.globalCssRepoPaths,
      useTailwindInPreview: graph.useTailwindInPreview,
      sandpackPathContext: graph.sandpackPathContext,
    });
  } catch (error: unknown) {
    console.error("Component analysis error:", error);
    const err = error as { message?: string };
    res.status(500).json({
      error: err.message || "Analysis failed",
    });
  }
});

const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || (isProd ? 3000 : 3001);

if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(
    isProd
      ? `[auto-dsm] Serving app + API on http://127.0.0.1:${port}`
      : `[auto-dsm] API on http://127.0.0.1:${port} (Vite proxies /api here)`,
  );
});
