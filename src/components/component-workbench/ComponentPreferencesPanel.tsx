import { ExternalLink } from "lucide-react";
import type { WorkbenchPreviewPrefs } from "@/lib/sandpack/workbench-preferences";
import { ComponentPreferencesForm } from "./ComponentPreferencesForm";

type Props = {
  prefs: WorkbenchPreviewPrefs;
  onChange: (next: WorkbenchPreviewPrefs) => void;
  githubHref: string | null;
  fileName: string;
};

export function ComponentPreferencesPanel({ prefs, onChange, githubHref, fileName }: Props) {
  return (
    <aside className="flex min-h-0 flex-col rounded-lg border border-border bg-surface-card shadow-sm lg:sticky lg:top-6 lg:max-h-[calc(100vh-5rem)] lg:self-start">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border px-5 pb-4 pt-5">
          <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
        </div>

        <ComponentPreferencesForm prefs={prefs} onChange={onChange} fileName={fileName} />
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
