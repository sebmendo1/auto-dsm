import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredThemePreference,
  resolveEffectiveDark,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./constants";

type ThemeContextValue = {
  preference: ThemePreference;
  /** Resolved for styling (after system → light/dark). */
  effectiveDark: boolean;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    typeof window !== "undefined" ? readStoredThemePreference() : "system",
  );
  const [prefersDark, setPrefersDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true,
  );

  const effectiveDark = useMemo(
    () => resolveEffectiveDark(preference, prefersDark),
    [preference, prefersDark],
  );

  useEffect(() => {
    applyDarkClass(effectiveDark);
  }, [effectiveDark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setPrefersDark(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ preference, effectiveDark, setPreference }),
    [preference, effectiveDark, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
