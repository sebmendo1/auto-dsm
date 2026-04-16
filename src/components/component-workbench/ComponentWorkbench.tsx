import { useMemo, useState } from "react";
import type { CachedComponentPayload } from "@/lib/sandpack/component-source-cache";
import { DEFAULT_WORKBENCH_PREFS, type WorkbenchPreviewPrefs } from "@/lib/sandpack/workbench-preferences";
import { parseProps, extractStateProps } from "@/lib/renderer/props-parser";
import { extractAllVariants } from "@/lib/renderer/variant-extractor";
import type { ExtractedProp, ExtractedVariant } from "@/lib/renderer/types";
import { ComponentWorkbenchShell } from "./ComponentWorkbenchShell";
import { ComponentWorkbenchInspector } from "./ComponentWorkbenchInspector";
import { ComponentWorkbenchPreviewColumn } from "./ComponentWorkbenchPreviewColumn";

function githubBlobUrl(repo: string, filePath: string): string | null {
  const parts = repo.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const [owner, name] = parts;
  const enc = filePath.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${owner}/${name}/blob/main/${enc}`;
}

function fileBaseName(path: string): string {
  return path.split("/").pop() ?? path;
}

function buildInitialPropValues(
  variants: ExtractedVariant[],
  props: ExtractedProp[],
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const v of variants) {
    values[v.name] = v.defaultValue ?? v.values[0] ?? "";
  }
  const stateNames = new Set(extractStateProps(props));
  for (const p of props) {
    if (p.name in values) continue; // already covered by variant
    if (p.type === "boolean" || p.type === "boolean | undefined") {
      values[p.name] = stateNames.has(p.name) ? false : false;
    } else if (
      p.type === "string" ||
      p.type === "string | undefined" ||
      p.type === "ReactNode" ||
      p.type === "ReactNode | undefined"
    ) {
      if (p.name === "children" || p.name === "label" || p.name === "title" || p.name === "text") {
        values[p.name] = p.name.charAt(0).toUpperCase() + p.name.slice(1);
      }
    }
  }
  return values;
}

type Props = {
  slug: string;
  data: CachedComponentPayload;
  repo: string;
};

export function ComponentWorkbench({ slug, data, repo }: Props) {
  const [prefs, setPrefs] = useState<WorkbenchPreviewPrefs>(DEFAULT_WORKBENCH_PREFS);
  const githubHref = useMemo(() => githubBlobUrl(repo, data.filePath), [repo, data.filePath]);
  const hasVirtualGraph =
    !!data.virtualRepoFiles && Object.keys(data.virtualRepoFiles).length > 0;

  // Extract prop and variant metadata from source
  const propsMeta = useMemo(() => parseProps(data.source), [data.source]);
  const variantsMeta = useMemo(() => extractAllVariants(data.source), [data.source]);

  const [propValues, setPropValues] = useState<Record<string, string | boolean>>(() =>
    buildInitialPropValues(variantsMeta, propsMeta),
  );

  const payload = useMemo(
    () => ({
      source: data.source,
      dependencies: data.dependencies,
      hasDefaultExport: data.hasDefaultExport,
      exportName: data.exportName,
      prefs,
      virtualRepoFiles: data.virtualRepoFiles,
      entryRepoPath: hasVirtualGraph ? data.filePath : undefined,
      globalCssRepoPaths: data.globalCssRepoPaths,
      useTailwindInPreview: data.useTailwindInPreview,
      sandpackPathContext: data.sandpackPathContext,
      propValues,
    }),
    [
      data.source,
      data.dependencies,
      data.hasDefaultExport,
      data.exportName,
      data.virtualRepoFiles,
      data.filePath,
      data.globalCssRepoPaths,
      data.useTailwindInPreview,
      data.sandpackPathContext,
      hasVirtualGraph,
      prefs,
      propValues,
    ],
  );

  const baseName = fileBaseName(data.filePath);

  return (
    <ComponentWorkbenchShell title={baseName}>
      <div className="max-w-4xl">
        <p className="font-mono text-xs text-foreground-tertiary">{data.filePath}</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
          Live preview in Sandpack uses files fetched from GitHub (including co-located CSS and local
          imports where possible). Tailwind-based repos enable a minimal in-preview Tailwind pipeline
          when <code className="font-mono text-foreground-tertiary">@tailwind</code> is detected.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch lg:gap-8">
        <ComponentWorkbenchPreviewColumn slug={slug} payload={payload} fileName={baseName} />
        <ComponentWorkbenchInspector
          source={data.source}
          fileName={baseName}
          prefs={prefs}
          onPrefsChange={setPrefs}
          githubHref={githubHref}
          propsMeta={propsMeta}
          variantsMeta={variantsMeta}
          propValues={propValues}
          onPropValuesChange={setPropValues}
        />
      </div>
    </ComponentWorkbenchShell>
  );
}
