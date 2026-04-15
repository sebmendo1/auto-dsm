import type { WorkbenchPreviewPrefs } from "@/lib/sandpack/workbench-preferences";
import { DEFAULT_WORKBENCH_PREFS } from "@/lib/sandpack/workbench-preferences";

type Props = {
  prefs: WorkbenchPreviewPrefs;
  onChange: (next: WorkbenchPreviewPrefs) => void;
  fileName: string;
};

export function ComponentPreferencesForm({ prefs, onChange, fileName }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto p-5">
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground-secondary" htmlFor="wb-canvas">
          Canvas
        </label>
        <select
          id="wb-canvas"
          className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
          value={prefs.canvas}
          onChange={(e) =>
            onChange({
              ...prefs,
              canvas: e.target.value as WorkbenchPreviewPrefs["canvas"],
            })
          }
        >
          <option value="neutral">Neutral</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground-secondary" htmlFor="wb-padding">
          Padding
        </label>
        <select
          id="wb-padding"
          className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus"
          value={prefs.padding}
          onChange={(e) =>
            onChange({
              ...prefs,
              padding: e.target.value as WorkbenchPreviewPrefs["padding"],
            })
          }
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-medium text-foreground-secondary">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={prefs.showCaption}
            onChange={(e) => onChange({ ...prefs, showCaption: e.target.checked })}
          />
          Show caption
        </label>
        <input
          type="text"
          className="w-full rounded-md border border-border bg-input-bg px-3 py-2 text-sm text-foreground placeholder:text-foreground-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-focus disabled:opacity-50"
          placeholder="Caption text"
          value={prefs.caption}
          disabled={!prefs.showCaption}
          onChange={(e) => onChange({ ...prefs, caption: e.target.value })}
        />
      </div>

      <button
        type="button"
        className="self-start text-xs text-foreground-tertiary underline-offset-2 hover:text-foreground-secondary hover:underline"
        onClick={() => onChange({ ...DEFAULT_WORKBENCH_PREFS })}
      >
        Reset preferences
      </button>

      <p className="text-xs text-foreground-secondary">
        Preview chrome only — does not inject props into <span className="font-mono">{fileName}</span>.
      </p>
    </div>
  );
}
