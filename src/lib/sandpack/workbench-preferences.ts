/** Preferences that only affect the preview wrapper in generated `App.tsx` (safe for any component). */
export type WorkbenchPreviewPrefs = {
  canvas: "neutral" | "light" | "dark";
  padding: "compact" | "comfortable";
  showCaption: boolean;
  caption: string;
};

export const DEFAULT_WORKBENCH_PREFS: WorkbenchPreviewPrefs = {
  canvas: "neutral",
  padding: "comfortable",
  showCaption: false,
  caption: "Preview",
};

export function canvasStyle(prefs: WorkbenchPreviewPrefs): { background: string; minHeight: number } {
  const bg =
    prefs.canvas === "light"
      ? "#f4f4f5"
      : prefs.canvas === "dark"
        ? "#0a0a0a"
        : "#18181b";
  return { background: bg, minHeight: 240 };
}

export function paddingPx(prefs: WorkbenchPreviewPrefs): number {
  return prefs.padding === "compact" ? 12 : 24;
}
