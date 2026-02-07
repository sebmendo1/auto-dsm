import type { ParseResult } from "./types";

const STORAGE_KEY = "autodsm:tokens";

export function readStoredTokens(): ParseResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParseResult;
  } catch {
    return null;
  }
}
