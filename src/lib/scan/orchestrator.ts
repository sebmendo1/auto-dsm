/**
 * Scan orchestrator — the pipeline that turns `{owner, repo}` into:
 *   • a list of ParsedComponents (each with render_config)
 *   • a list of Tokens
 *   • repo-level metadata (commits, framework, etc.)
 *
 * Designed to be driven by the SSE route handler — each phase emits a
 * progress event on the provided `emit` callback.
 */

import { GitHubClient } from '../github/files';
import { parseComponent } from '../parsers/components';
import { extractTokens, type Token } from '../parsers/tokens';
import type { ParsedComponent, RenderConfig } from '../render/types';

export type ScanEvent =
  | { phase: 'fetching'; message: string }
  | { phase: 'framework_ok'; message: string }
  | { phase: 'parsing'; current: number; total: number; message: string }
  | { phase: 'tokens'; message: string }
  | { phase: 'assets'; message: string }
  | { phase: 'done'; message: string; result: ScanResult }
  | { phase: 'unsupported'; reason: string; message: string }
  | { phase: 'error'; message: string };

export interface ScanResult {
  framework: string;
  components: ParsedComponent[];
  tokens: Token[];
  assets: { name: string; file_path: string }[];
  commits: Array<{ sha: string; message: string; author: string; date: string; url: string }>;
  render_configs: Record<string, RenderConfig>; // slug → config
}

export async function scanRepo(
  owner: string,
  name: string,
  emit: (ev: ScanEvent) => void,
): Promise<ScanResult | null> {
  const gh = new GitHubClient();
  try {
    emit({ phase: 'fetching', message: 'Fetching repository…' });
    const defaultBranch = await gh.getDefaultBranch({ owner, name });
    const tree = await gh.getTree({ owner, name, branch: defaultBranch });

    // ─── Framework gate ───────────────────────────────────────────────
    emit({ phase: 'fetching', message: 'Detecting framework…' });
    const pkgEntry = tree.find((t) => t.path === 'package.json');
    if (!pkgEntry) {
      emit({ phase: 'unsupported', reason: 'no_package_json', message: 'No package.json detected.' });
      return null;
    }
    const pkgJson = await gh.getFile({ owner, name, branch: defaultBranch }, 'package.json');
    const pkg = safeParseJson(pkgJson);
    const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}), ...(pkg?.peerDependencies ?? {}) };
    if (deps['vue'] || deps['svelte'] || deps['@angular/core'] || deps['solid-js']) {
      emit({ phase: 'unsupported', reason: 'non_react_framework', message: 'Non-React framework detected.' });
      return null;
    }
    if (!deps['react']) {
      emit({ phase: 'unsupported', reason: 'no_react', message: 'React not found in dependencies.' });
      return null;
    }
    emit({ phase: 'framework_ok', message: 'Framework: React + TypeScript ✓' });

    // ─── Component candidates ─────────────────────────────────────────
    const tsxFiles = tree.filter(
      (t) =>
        t.type === 'blob' &&
        t.path.endsWith('.tsx') &&
        !/\b(__tests__|stories|node_modules|\.next|dist|build|out|coverage|e2e|playwright)\b/.test(t.path) &&
        !/\.(test|spec|stories)\.tsx$/.test(t.path) &&
        (t.size ?? 0) < 60_000 &&
        looksLikeComponentFile(t.path),
    );

    // Build a local-files map for relative-import resolution during parsing.
    const relatedFiles = new Map<string, string>();

    const components: ParsedComponent[] = [];
    const render_configs: Record<string, RenderConfig> = {};

    const candidates = tsxFiles.slice(0, 80); // safety cap
    for (let i = 0; i < candidates.length; i++) {
      const entry = candidates[i];
      emit({
        phase: 'parsing',
        current: i + 1,
        total: candidates.length,
        message: `Parsing components… ${i + 1}/${candidates.length}`,
      });
      let source: string;
      try {
        source = await gh.getFile({ owner, name, branch: defaultBranch }, entry.path);
      } catch {
        continue;
      }
      relatedFiles.set('/' + entry.path, source);
      const parsed = parseComponent({ filePath: entry.path, source, relatedFiles });
      if (!parsed) continue;
      components.push(parsed);
      render_configs[parsed.slug] = buildRenderConfig(parsed);
    }

    // ─── Tokens ───────────────────────────────────────────────────────
    emit({ phase: 'tokens', message: 'Extracting design tokens…' });
    const tokenFilePaths = tree
      .filter((t) =>
        t.type === 'blob' &&
        (t.path.endsWith('tailwind.config.ts') ||
          t.path.endsWith('tailwind.config.js') ||
          t.path.endsWith('tailwind.config.cjs') ||
          t.path.endsWith('tailwind.config.mjs') ||
          /\.tokens\.json$/.test(t.path) ||
          /tokens\/[^/]+\.json$/.test(t.path) ||
          t.path.endsWith('globals.css') ||
          t.path.endsWith('global.css') ||
          /app\/.*\.css$/.test(t.path) ||
          /styles\/.*\.css$/.test(t.path)),
      )
      .slice(0, 10);

    const tokenFiles: Record<string, string> = {};
    for (const p of tokenFilePaths) {
      try {
        tokenFiles[p.path] = await gh.getFile({ owner, name, branch: defaultBranch }, p.path);
      } catch {
        /* ignore */
      }
    }
    const tokens = extractTokens({ files: tokenFiles });

    // ─── Assets ───────────────────────────────────────────────────────
    emit({ phase: 'assets', message: 'Scanning assets…' });
    const assets = tree
      .filter((t) => /\.(svg|png|jpg|webp|ico)$/.test(t.path) && !/node_modules/.test(t.path))
      .slice(0, 200)
      .map((t) => ({ name: t.path.split('/').pop() ?? t.path, file_path: t.path }));

    // ─── Commits ──────────────────────────────────────────────────────
    const commits = await gh.getCommits({ owner, name });

    const result: ScanResult = {
      framework: 'react-typescript',
      components,
      tokens,
      assets,
      commits,
      render_configs,
    };
    emit({ phase: 'done', message: 'Done. Redirecting…', result });
    return result;
  } catch (err) {
    emit({ phase: 'error', message: String((err as Error)?.message ?? err) });
    return null;
  }
}

function buildRenderConfig(parsed: ParsedComponent): RenderConfig {
  // Build the in-memory virtual filesystem for the iframe runtime.
  const files: Record<string, string> = {};
  const primaryKey = '/' + parsed.file_path;
  files[primaryKey] = parsed.source_code;
  for (const local of parsed.local_imports) {
    const key = local.resolved_path.startsWith('/') ? local.resolved_path : '/' + local.resolved_path;
    files[key] = local.source;
  }
  return {
    entry_module: parsed.name,
    files,
    dependencies: parsed.dependencies,
    providers: [],
    initial_props: parsed.initial_props,
    prop_controls: parsed.props,
    presets: parsed.presets,
  };
}

function looksLikeComponentFile(path: string): boolean {
  const base = path.split('/').pop() ?? '';
  // Must start uppercase (PascalCase) OR live under a `components` folder.
  return /^[A-Z]/.test(base.replace(/\.tsx$/, '')) || /\/components\//.test(path);
}

function safeParseJson(s: string): { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string> } | null {
  try { return JSON.parse(s); } catch { return null; }
}
