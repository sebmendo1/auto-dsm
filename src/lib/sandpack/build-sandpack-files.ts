import type { SandpackFiles } from "@codesandbox/sandpack-react";
import { REACT_TYPESCRIPT_TEMPLATE } from "@codesandbox/sandpack-react";
import { extractDependenciesFromSource } from "@/lib/github/component-fetcher";
import type { TsPathsConfig } from "@/lib/github/tsconfig-paths";
import { pathAliasPrefixesFromPaths } from "@/lib/github/tsconfig-paths";
import { npmInstallPackageName } from "./npm-spec";
import { rewriteRepoSourceForSandpack } from "./repo-import-rewrite";
import {
  sanitizeComponentSourceForSandpack,
  stripTailwindDirectives,
} from "./sanitize-component-source";
import type { WorkbenchPreviewPrefs } from "./workbench-preferences";
import { canvasStyle, paddingPx } from "./workbench-preferences";

const BASE_DEPENDENCIES: Record<string, string> = {
  react: "^18.2.0",
  "react-dom": "^18.2.0",
};

/** Map extracted import specifiers to pinned-ish versions for faster installs. */
const KNOWN_VERSIONS: Record<string, string> = {
  "lucide-react": "^0.460.0",
  clsx: "^2.1.0",
  "class-variance-authority": "^0.7.0",
  "tailwind-merge": "^2.5.4",
  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^3.9.0",
  zod: "^3.23.8",
  "@radix-ui/react-slot": "^1.1.0",
  "@radix-ui/react-dialog": "^1.1.2",
  "@radix-ui/react-dropdown-menu": "^2.1.2",
  "@radix-ui/react-label": "^2.1.0",
  "@radix-ui/react-select": "^2.1.2",
  "@radix-ui/react-tabs": "^1.1.1",
  "@radix-ui/react-tooltip": "^1.1.3",
  "@radix-ui/react-popover": "^1.1.2",
  "@radix-ui/react-checkbox": "^1.1.2",
  "@radix-ui/react-switch": "^1.1.1",
  "@radix-ui/react-separator": "^1.1.0",
  "@radix-ui/react-accordion": "^1.2.1",
  "@radix-ui/react-avatar": "^1.1.1",
  "@radix-ui/react-scroll-area": "^1.2.0",
  "@radix-ui/react-toggle": "^1.1.0",
  "@radix-ui/react-toggle-group": "^1.1.0",
  cmdk: "^1.0.4",
  "date-fns": "^4.1.0",
  sonner: "^1.7.0",
  vaul: "^1.1.1",
  recharts: "^2.13.3",
  "embla-carousel-react": "^8.3.0",
  "next-themes": "^0.4.4",
  "react-router-dom": "^7.6.2",
  tailwindcss: "^3.4.17",
  postcss: "^8.4.49",
  autoprefixer: "^10.4.20",
  sass: "^1.81.0",
};

/** Full CRA `react-ts` file tree so overrides reliably replace `/App.tsx` (the default is “Hello world”). */
function cloneReactTsTemplate(): SandpackFiles {
  const files: SandpackFiles = {};
  const raw = REACT_TYPESCRIPT_TEMPLATE.files as Record<string, { code: string }>;
  for (const [path, entry] of Object.entries(raw)) {
    files[path] = { code: entry.code };
  }
  return files;
}

function mergeDependencies(extracted: string[], extra: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = { ...BASE_DEPENDENCIES, ...extra };
  for (const pkg of extracted) {
    const name = npmInstallPackageName(pkg.trim());
    if (!name || name === "react" || name === "react-dom") continue;
    merged[name] = KNOWN_VERSIONS[name] ?? "latest";
  }
  return merged;
}

function sandpackPathForRepoFile(repoPath: string): string {
  return `/src/r/${repoPath}`;
}

function isCodeLike(repoPath: string): boolean {
  return /\.(tsx?|jsx?|mjs|cjs)$/i.test(repoPath);
}

function isCssLike(repoPath: string): boolean {
  return /\.(css|scss)$/i.test(repoPath);
}

function entryImportSpecifier(entryRepoPath: string): string {
  const noExt = entryRepoPath.replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, "");
  return `./src/r/${noExt}`;
}

export function buildAppEntrySource(params: {
  hasDefaultExport: boolean;
  exportName: string;
  prefs: WorkbenchPreviewPrefs;
  entryImport?: string;
  globalCssImports?: string[];
  propValues?: Record<string, string | boolean>;
}): string {
  const { hasDefaultExport, exportName, prefs } = params;
  const { background, minHeight } = canvasStyle(prefs);
  const pad = paddingPx(prefs);

  const entryImport = params.entryImport ?? "./Component";
  const importLine = hasDefaultExport
    ? `import Demo from "${entryImport}";`
    : `import { ${exportName} as Demo } from "${entryImport}";`;

  const styleLines = (params.globalCssImports ?? []).map((p) => `import "${p}";`);

  const captionLine = prefs.showCaption
    ? `      <p style={{ margin: "0 0 12px", fontSize: 12, opacity: 0.75 }}>{${JSON.stringify(prefs.caption)}}</p>`
    : "";

  // Build prop string from propValues
  let childrenValue = "";
  const propAttrs: string[] = [];
  if (params.propValues) {
    for (const [key, value] of Object.entries(params.propValues)) {
      if (key === "children") {
        if (typeof value === "string" && value.length > 0) {
          childrenValue = value;
        }
        continue;
      }
      if (value === false || value === "" || value === undefined) continue;
      if (value === true) {
        propAttrs.push(key);
      } else {
        propAttrs.push(`${key}=${JSON.stringify(value)}`);
      }
    }
  }
  const propsString = propAttrs.length > 0 ? ` ${propAttrs.join(" ")}` : "";
  const demoJsx = childrenValue
    ? `<Demo${propsString}>${childrenValue}</Demo>`
    : `<Demo${propsString} />`;

  return [
    ...styleLines,
    importLine,
    'import React from "react";',
    'import { MemoryRouter } from "react-router-dom";',
    "",
    "export default function App(): React.ReactElement {",
    "  return (",
    "    <div",
    "      style={{",
    `        padding: ${pad},`,
    `        background: "${background}",`,
    `        minHeight: ${minHeight},`,
    '        boxSizing: "border-box",',
    '        display: "flex",',
    '        alignItems: "center",',
    '        justifyContent: "center",',
    "      }}",
    "    >",
    captionLine,
    "      <MemoryRouter initialEntries={['/']}>",
    `        ${demoJsx}`,
    "      </MemoryRouter>",
    "    </div>",
    "  );",
    "}",
  ].join("\n");
}

/** CRA `react-ts` template imports `./styles.css` from `/index.tsx` — not `/src/index.css`. */
const TAILWIND_STYLES = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;

const TAILWIND_CONFIG = `/** Auto-generated for component preview */
module.exports = {
  content: [
    "./public/index.html",
    "./**/*.{js,jsx,ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
`;

const POSTCSS_CONFIG = `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };`;

export type BuildSandpackFilesParams = {
  source: string;
  dependencies: string[];
  hasDefaultExport: boolean;
  exportName: string;
  prefs: WorkbenchPreviewPrefs;
  virtualRepoFiles?: Record<string, string>;
  entryRepoPath?: string;
  globalCssRepoPaths?: string[];
  useTailwindInPreview?: boolean;
  /** From `GET /api/components/:slug` — enables alias → relative rewrite in graph mode. */
  sandpackPathContext?: TsPathsConfig;
  /** Live prop values from the inspector controls — injected into the Sandpack App.tsx entry. */
  propValues?: Record<string, string | boolean>;
};

export function buildSandpackFiles(params: BuildSandpackFilesParams): {
  files: SandpackFiles;
  customDependencies: Record<string, string>;
} {
  const useGraph =
    params.virtualRepoFiles &&
    params.entryRepoPath &&
    Object.keys(params.virtualRepoFiles).length > 0;

  const files = cloneReactTsTemplate();
  const extraDeps: Record<string, string> = {
    // Preview entry wraps <Demo /> in MemoryRouter so Link / useLocation / etc. work.
    "react-router-dom": KNOWN_VERSIONS["react-router-dom"] ?? "^7.6.2",
  };
  let mergedDeps = params.dependencies;

  if (useGraph && params.entryRepoPath && params.virtualRepoFiles) {
    const { virtualRepoFiles, entryRepoPath, useTailwindInPreview } = params;
    const globalCssRepoPaths = params.globalCssRepoPaths ?? [];
    const graphPathSet = new Set(Object.keys(virtualRepoFiles));
    const pathCtx: TsPathsConfig | null = params.sandpackPathContext ?? null;
    const pathPrefixes = pathCtx ? pathAliasPrefixesFromPaths(pathCtx.paths) : [];

    for (const [repoPath, raw] of Object.entries(virtualRepoFiles)) {
      const sp = sandpackPathForRepoFile(repoPath);
      if (isCodeLike(repoPath)) {
        files[sp] = { code: rewriteRepoSourceForSandpack(repoPath, raw, graphPathSet, pathCtx) };
      } else if (isCssLike(repoPath)) {
        const css =
          useTailwindInPreview && /@tailwind\b/.test(raw) ? stripTailwindDirectives(raw) : raw;
        files[sp] = { code: css };
      } else {
        files[sp] = { code: raw };
      }
    }

    const entryImport = entryImportSpecifier(entryRepoPath);
    const globalCssImports = globalCssRepoPaths.map((p) => `./src/r/${p}`);

    const appCode = buildAppEntrySource({
      hasDefaultExport: params.hasDefaultExport,
      exportName: params.exportName || "Component",
      prefs: params.prefs,
      entryImport,
      globalCssImports,
      propValues: params.propValues,
    });

    files["/App.tsx"] = { code: appCode, active: true };

    if (useTailwindInPreview) {
      files["/tailwind.config.cjs"] = { code: TAILWIND_CONFIG };
      files["/postcss.config.cjs"] = { code: POSTCSS_CONFIG };
      files["/styles.css"] = { code: TAILWIND_STYLES };
      extraDeps.tailwindcss = KNOWN_VERSIONS.tailwindcss;
      extraDeps.postcss = KNOWN_VERSIONS.postcss;
      extraDeps.autoprefixer = KNOWN_VERSIONS.autoprefixer;
    }

    const hasScss = Object.keys(virtualRepoFiles).some((k) => k.endsWith(".scss"));
    if (hasScss) {
      extraDeps.sass = KNOWN_VERSIONS.sass;
    }

    mergedDeps = [
      ...new Set(
        Object.values(virtualRepoFiles).flatMap((src) =>
          extractDependenciesFromSource(src, { pathAliasPrefixes: pathPrefixes }),
        ),
      ),
    ];
  } else {
    const componentCode = sanitizeComponentSourceForSandpack(params.source);
    const appCode = buildAppEntrySource({
      hasDefaultExport: params.hasDefaultExport,
      exportName: params.exportName || "Component",
      prefs: params.prefs,
      propValues: params.propValues,
    });
    files["/Component.tsx"] = { code: componentCode, active: true };
    files["/App.tsx"] = { code: appCode, active: true };
  }

  return {
    files,
    customDependencies: mergeDependencies(mergedDeps, extraDeps),
  };
}
