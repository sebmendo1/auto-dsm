import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeRepoInput } from "@/lib/utils";
import {
  fetchRepoMeta,
  fetchTree,
  fetchFileText,
  fetchFileBuffer,
} from "@/lib/github/fetch";
import { buildBrandProfile } from "@/lib/extract";
import type { FontFileInput } from "@/lib/extract";
import type { AssetFile } from "@/lib/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

// Limits to keep scans fast and memory-safe on a serverless function
const MAX_CSS_FILES = 12;
const MAX_LAYOUT_FILES = 6;
const MAX_ASSET_FILES = 80;

interface TreeEntry {
  path: string;
  size: number;
}

function hasTsxOrTs(tree: TreeEntry[]): boolean {
  return tree.some(
    (e) => e.path.endsWith(".tsx") || e.path.endsWith(".ts"),
  );
}

/**
 * POST /api/scan
 * Body: { repo: "owner/name" OR full GitHub URL }
 *
 * 1. Authenticates the user.
 * 2. Validates framework gate (React + TS).
 * 3. Runs the full extraction pipeline.
 * 4. Upserts brand_repos with the resulting BrandProfile JSONB.
 */
export async function POST(req: NextRequest) {
  let body: { repo?: string; projectName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = normalizeRepoInput(body.repo ?? "");
  if (!slug) {
    return NextResponse.json(
      { error: "Invalid repo. Use 'owner/name' or a GitHub URL." },
      { status: 400 },
    );
  }
  const [owner, name] = slug.split("/");
  const projectName = (body.projectName ?? "").trim() || name;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── 1. Repo meta ───────────────────────────────────────────────────────────
  const meta = await fetchRepoMeta(owner, name);
  if (!meta) {
    return NextResponse.json(
      { error: "Repository not found or not accessible." },
      { status: 404 },
    );
  }

  // ── 2. Tree ────────────────────────────────────────────────────────────────
  const rawTree = await fetchTree(owner, name, meta.sha);
  const tree: TreeEntry[] = rawTree.map((t) => ({
    path: t.path,
    size: t.size,
  }));
  if (tree.length === 0) {
    return NextResponse.json(
      { error: "Repository tree is empty or inaccessible." },
      { status: 500 },
    );
  }

  // ── 3. Framework gate ─────────────────────────────────────────────────────
  const pkgJsonEntry = tree.find(
    (e) => e.path === "package.json" || e.path.endsWith("/package.json"),
  );
  if (!pkgJsonEntry) {
    await writeRepoUnsupported(
      supabase,
      user.id,
      meta,
      "no-package-json",
    );
    return NextResponse.json(
      { unsupported: "no-package-json" },
      { status: 200 },
    );
  }

  const pkgSource = await fetchFileText(
    owner,
    name,
    pkgJsonEntry.path,
    meta.sha,
  );
  if (!pkgSource) {
    return NextResponse.json(
      { error: "Could not read package.json." },
      { status: 500 },
    );
  }
  let pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  try {
    pkg = JSON.parse(pkgSource);
  } catch {
    await writeRepoUnsupported(
      supabase,
      user.id,
      meta,
      "invalid-package-json",
    );
    return NextResponse.json(
      { unsupported: "invalid-package-json" },
      { status: 200 },
    );
  }
  const allDeps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  };
  const hasReact = "react" in allDeps;
  const hasTs = "typescript" in allDeps || hasTsxOrTs(tree);

  if (!hasReact) {
    await writeRepoUnsupported(supabase, user.id, meta, "no-react");
    return NextResponse.json({ unsupported: "no-react" }, { status: 200 });
  }
  if (!hasTs) {
    await writeRepoUnsupported(supabase, user.id, meta, "no-typescript");
    return NextResponse.json(
      { unsupported: "no-typescript" },
      { status: 200 },
    );
  }

  // ── 4. Tailwind config ────────────────────────────────────────────────────
  const tailwindEntry = tree.find((e) =>
    /(^|\/)tailwind\.config\.(ts|js|cjs|mjs)$/.test(e.path),
  );
  const tailwindConfigSource = tailwindEntry
    ? (await fetchFileText(owner, name, tailwindEntry.path, meta.sha)) ??
      undefined
    : undefined;

  // ── 5. CSS files ──────────────────────────────────────────────────────────
  const cssEntries = tree
    .filter(
      (e) =>
        (e.path.endsWith(".css") ||
          e.path.endsWith(".scss") ||
          e.path.endsWith(".sass")) &&
        !e.path.includes("node_modules/") &&
        e.size < 500_000,
    )
    // Prefer globals / tailwind / app css
    .sort((a, b) => rankCssPath(a.path) - rankCssPath(b.path))
    .slice(0, MAX_CSS_FILES);

  const cssSources: Array<{ path: string; content: string }> = [];
  for (const entry of cssEntries) {
    const content = await fetchFileText(owner, name, entry.path, meta.sha);
    if (content) cssSources.push({ path: entry.path, content });
  }

  // ── 6. shadcn components.json ─────────────────────────────────────────────
  const shadcnEntry = tree.find(
    (e) => e.path === "components.json" || e.path.endsWith("/components.json"),
  );
  const shadcnJson = shadcnEntry
    ? (await fetchFileText(owner, name, shadcnEntry.path, meta.sha)) ??
      undefined
    : undefined;

  // ── 7. Layout files for font detection ────────────────────────────────────
  const layoutCandidates = tree
    .filter((e) =>
      /(^|\/)(app\/layout|app\/_app|pages\/_app|src\/main|src\/app\/layout)\.(ts|tsx|js|jsx)$/.test(
        e.path,
      ),
    )
    .slice(0, MAX_LAYOUT_FILES);
  const layoutFiles: FontFileInput[] = [];
  for (const entry of layoutCandidates) {
    const content = await fetchFileText(owner, name, entry.path, meta.sha);
    if (content) layoutFiles.push({ path: entry.path, content });
  }

  // ── 8. Asset scan ─────────────────────────────────────────────────────────
  const assetExtRe = /\.(svg|png|jpe?g|webp|ico|gif)$/i;
  const assetCandidates = tree
    .filter(
      (e) =>
        assetExtRe.test(e.path) &&
        (e.path.startsWith("public/") ||
          e.path.includes("/public/") ||
          e.path.startsWith("src/assets/") ||
          e.path.includes("/src/assets/")) &&
        e.size > 0 &&
        e.size < 2_000_000,
    )
    .slice(0, MAX_ASSET_FILES);

  const assetFiles: AssetFile[] = [];
  for (const entry of assetCandidates) {
    const buf = await fetchFileBuffer(owner, name, entry.path, meta.sha);
    if (buf) assetFiles.push({ path: entry.path, buffer: buf });
  }

  // ── 9. Build profile ──────────────────────────────────────────────────────
  let profile;
  try {
    profile = await buildBrandProfile({
      repo: { owner, name, url: meta.url },
      tailwindConfigSource,
      tailwindConfigPath: tailwindEntry?.path,
      cssSources,
      shadcnJson,
      shadcnConfigPath: shadcnEntry?.path,
      assetFiles,
      layoutFiles,
      sha: meta.sha,
      branch: meta.defaultBranch,
      filesScanned:
        cssSources.length +
        layoutFiles.length +
        assetFiles.length +
        (tailwindConfigSource ? 1 : 0) +
        (shadcnJson ? 1 : 0) +
        1,
    });
    profile = {
      ...profile,
      meta: {
        ...profile.meta,
        projectName,
      },
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[scan] buildBrandProfile failed:", message);
    return NextResponse.json(
      { error: `Extraction failed: ${message}` },
      { status: 500 },
    );
  }

  // ── 10. Upsert brand_repos ────────────────────────────────────────────────
  await supabase.from("app_users").upsert(
    {
      id: user.id,
      email: user.email,
      github_login: (user.user_metadata?.user_name as string | undefined) ?? null,
      avatar_url:
        (user.user_metadata?.avatar_url as string | undefined) ?? null,
    },
    { onConflict: "id" },
  );

  const { error: upsertErr } = await supabase.from("brand_repos").upsert(
    {
      user_id: user.id,
      owner: meta.owner,
      name: meta.name,
      default_branch: meta.defaultBranch,
      framework: "react-ts",
      last_scanned_sha: meta.sha,
      last_scanned_at: new Date().toISOString(),
      scan_status: "completed",
      unsupported_reason: null,
      brand_profile: profile,
    },
    { onConflict: "user_id,owner,name" },
  );

  if (upsertErr) {
    console.error("[scan] DB upsert failed:", upsertErr.message);
    return NextResponse.json(
      { error: `Save failed: ${upsertErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: "completed", owner, name });
}

// ── Helpers ───────────────────────────────────────────────────────────────

function rankCssPath(p: string): number {
  const lp = p.toLowerCase();
  if (/globals\.css$/.test(lp)) return 0;
  if (/app\/.*\.css$/.test(lp)) return 1;
  if (/tailwind.*\.css$/.test(lp)) return 1;
  if (/styles?\/.*\.css$/.test(lp)) return 2;
  if (/src\/.*\.css$/.test(lp)) return 3;
  return 5;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function writeRepoUnsupported(
  supabase: SupabaseClient,
  userId: string,
  meta: { owner: string; name: string; defaultBranch: string; sha: string },
  reason: string,
): Promise<void> {
  await supabase.from("app_users").upsert(
    { id: userId },
    { onConflict: "id" },
  );
  await supabase.from("brand_repos").upsert(
    {
      user_id: userId,
      owner: meta.owner,
      name: meta.name,
      default_branch: meta.defaultBranch,
      scan_status: "unsupported",
      unsupported_reason: reason,
      last_scanned_sha: meta.sha,
      last_scanned_at: new Date().toISOString(),
    },
    { onConflict: "user_id,owner,name" },
  );
}
