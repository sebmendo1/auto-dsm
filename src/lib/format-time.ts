/**
 * Relative time label for scan timestamps, etc.
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then || isNaN(then)) return "just now";
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
