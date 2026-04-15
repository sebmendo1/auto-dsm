import { useMemo } from "react";
import { SandpackPreview, SandpackProvider } from "@codesandbox/sandpack-react";
import { githubLight, sandpackDark } from "@codesandbox/sandpack-themes";
import { useTheme } from "@/theme/ThemeProvider";
import type { TsPathsConfig } from "@/lib/github/tsconfig-paths";
import { buildSandpackFiles } from "@/lib/sandpack/build-sandpack-files";
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
};

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
      }),
    [
      payload.source,
      payload.dependencies,
      payload.hasDefaultExport,
      payload.exportName,
      payload.prefs,
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
          layout: "preview",
          showTabs: false,
          showConsole: false,
          showConsoleButton: false,
          resizablePanels: false,
        }}
      >
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
