import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** owner/repo OR https://github.com/owner/repo → "owner/repo" or null */
export function normalizeRepoInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // URL form
  const urlMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i,
  );
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2].replace(/\.git$/i, "")}`;

  // owner/repo form
  const slugMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (slugMatch) return `${slugMatch[1]}/${slugMatch[2].replace(/\.git$/i, "")}`;

  return null;
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}
