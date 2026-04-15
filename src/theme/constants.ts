export const THEME_STORAGE_KEY = "autodsm:theme" as const;

export type ThemePreference = "light" | "dark" | "system";

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // ignore
  }
  return "system";
}

export function resolveEffectiveDark(
  preference: ThemePreference,
  prefersDark: boolean,
): boolean {
  if (preference === "dark") return true;
  if (preference === "light") return false;
  return prefersDark;
}
