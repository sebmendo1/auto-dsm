import { useEffect, useMemo, useRef } from "react";
import { SandpackPreview, SandpackProvider, useSandpack } from "@codesandbox/sandpack-react";
import { githubLight, sandpackDark } from "@codesandbox/sandpack-themes";
import { useTheme } from "@/theme/ThemeProvider";
import type { TsPathsConfig } from "@/lib/github/tsconfig-paths";
import { buildSandpackFiles, buildAppEntrySource } from "@/lib/sandpack/build-sandpack-files";
import type { WorkbenchPreviewPrefs } from "@/lib/sandpack/workbench-preferences";

export type SandpackWorkbenchPayload = {
  source: string;
  dependencies: string[];
  hasDefaultExport: boolean;
  exportName: string;
  prefs: WorkbenchPreviewPrefs;
  virtualRepoFiles?: Record<string, string>;
  entryRepoPath?: string;
  globalCssRepoPaths?: string[];
  useTailwindInPreview?: boolean;
  sandpackPathContext?: TsPathsConfig;
  propValues?: Record<string, string | boolean>;
};

/** Inner component that hot-patches App.tsx when propValues change (avoids remounting SandpackProvider). */
function SandpackPropPatcher({
  payload,
}: {
  payload: SandpackWorkbenchPayload;
}) {
  const { sandpack } = useSandpack();
  const prevPropsRef = useRef(payload.propValues);

  useEffect(() => {
    // Skip on initial mount — the files already include the initial propValues
    if (prevPropsRef.current === payload.propValues) return;
    prevPropsRef.current = payload.propValues;

    const hasGraph = payload.virtualRepoFiles && payload.entryRepoPath && Object.keys(payload.virtualRepoFiles).length > 0;
    const entryImport = hasGraph && payload.entryRepoPath
      ? `./src/r/${payload.entryRepoPath.replace(/\.(tsx|ts|jsx|js|mjs|cjs)$/i, "")}`
      : "./Component";
    const globalCssImports = hasGraph
      ? (payload.globalCssRepoPaths ?? []).map((p) => `./src/r/${p}`)
      : [];

    const newAppCode = buildAppEntrySource({
      hasDefaultExport: payload.hasDefaultExport,
      exportName: payload.exportName || "Component",
      prefs: payload.prefs,
      entryImport,
      globalCssImports,
      propValues: payload.propValues,
    });

    sandpack.updateFile("/App.tsx", newAppCode);
  }, [payload.propValues, payload.prefs, payload.hasDefaultExport, payload.exportName, payload.entryRepoPath, payload.virtualRepoFiles, payload.globalCssRepoPaths, sandpack]);

  return null;
}

export function ComponentWorkbenchSandpack({
  slug,
  payload,
}: {
  slug: string;
  payload: SandpackWorkbenchPayload;
}) {
  const { effectiveDark } = useTheme();
  const theme = effectiveDark ? sandpackDark : githubLight;

  const { files, customDependencies } = useMemo(
    () =>
      buildSandpackFiles({
        source: payload.source,
        dependencies: payload.dependencies,
        hasDefaultExport: payload.hasDefaultExport,
        exportName: payload.exportName,
        prefs: payload.prefs,
        virtualRepoFiles: payload.virtualRepoFiles,
        entryRepoPath: payload.entryRepoPath,
        globalCssRepoPaths: payload.globalCssRepoPaths,
        useTailwindInPreview: payload.useTailwindInPreview,
        sandpackPathContext: payload.sandpackPathContext,
        propValues: payload.propValues,
      }),
    [
      payload.source,
      payload.dependencies,
      payload.hasDefaultExport,
      payload.exportName,
      // intentionally exclude propValues and prefs — those are hot-patched
      payload.virtualRepoFiles,
      payload.entryRepoPath,
      payload.globalCssRepoPaths,
      payload.useTailwindInPreview,
      payload.sandpackPathContext,
    ],
  );

  return (
    <div className="sandpack-workbench flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-lg border border-border">
      <SandpackProvider
        key={slug}
        template="react-ts"
        theme={theme}
        files={files}
        customSetup={{
          dependencies: customDependencies,
        }}
        options={{
          initMode: "immediate",
          recompileMode: "delayed",
          recompileDelay: 320,
        }}
      >
        <SandpackPropPatcher payload={payload} />
        <SandpackPreview
          className="min-h-0 flex-1"
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showRefreshButton={false}
          showSandpackErrorOverlay
        />
      </SandpackProvider>
    </div>
  );
}
