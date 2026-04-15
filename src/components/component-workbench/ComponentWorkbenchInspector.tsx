import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { WorkbenchPreviewPrefs } from "@/lib/sandpack/workbench-preferences";
import { ComponentPreferencesForm } from "./ComponentPreferencesForm";

type RightTab = "code" | "preferences";

type Props = {
  source: string;
  fileName: string;
  prefs: WorkbenchPreviewPrefs;
  onPrefsChange: (next: WorkbenchPreviewPrefs) => void;
  githubHref: string | null;
};

export function ComponentWorkbenchInspector({
  source,
  fileName,
  prefs,
  onPrefsChange,
  githubHref,
}: Props) {
  const [tab, setTab] = useState<RightTab>("preferences");
  const baseId = useId();
  const codePanelId = `${baseId}-code-panel`;
  const prefsPanelId = `${baseId}-prefs-panel`;

  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-border bg-surface-card shadow-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-5rem)] lg:self-start">
      <div
        role="tablist"
        aria-label="Component inspector"
        className="m-4 mb-0 flex shrink-0 gap-0 rounded-lg border border-border bg-surface-card p-1 shadow-sm"
      >
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-code`}
          aria-selected={tab === "code"}
          aria-controls={codePanelId}
          className={`min-w-0 flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
            tab === "code"
              ? "bg-background-elevated text-foreground shadow-sm"
              : "text-foreground-secondary hover:text-foreground"
          }`}
          onClick={() => setTab("code")}
        >
          Code
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-preferences`}
          aria-selected={tab === "preferences"}
          aria-controls={prefsPanelId}
          className={`min-w-0 flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus ${
            tab === "preferences"
              ? "bg-background-elevated text-foreground shadow-sm"
              : "text-foreground-secondary hover:text-foreground"
          }`}
          onClick={() => setTab("preferences")}
        >
          Preferences
        </button>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {tab === "code" ? (
          <div
            id={codePanelId}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-code`}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="shrink-0 border-b border-border px-5 pb-3 pt-4">
              <p className="text-xs font-medium text-foreground">{fileName}</p>
              <p className="mt-1 text-xs text-foreground-secondary">
                Read-only source from the repo. Sandpack may omit some imports in the live preview.
              </p>
            </div>
            <pre className="min-h-0 flex-1 overflow-auto p-5 text-[11px] leading-relaxed text-foreground-secondary">
              <code className="whitespace-pre font-mono">{source}</code>
            </pre>
          </div>
        ) : (
          <div
            id={prefsPanelId}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-preferences`}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="shrink-0 border-b border-border px-5 pb-3 pt-4">
              <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
            </div>
            <ComponentPreferencesForm prefs={prefs} onChange={onPrefsChange} fileName={fileName} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border p-5 pt-4">
        {githubHref ? (
          <a
            href={githubHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background-elevated px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {fileName}
          </a>
        ) : (
          <p className="text-xs text-foreground-tertiary">Connect a repo to link to GitHub.</p>
        )}
      </div>
    </aside>
  );
}
