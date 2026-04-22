/**
 * Display label for a scanned color token name (e.g. "primary-900" → "primary / 900").
 */
export function formatColorTitle(name: string): string {
  const t = name.trim();
  if (!t) return t;
  // Match "group-shade" where shade is digits (common for scales)
  const m = t.match(/^(.+?)[-_](\d+)$/);
  if (m) {
    return `${m[1].replace(/[-_]/g, " ")} / ${m[2]}`;
  }
  // "foo-bar-baz" with last segment as scale
  const last = t.lastIndexOf("-");
  if (last > 0) {
    const right = t.slice(last + 1);
    if (/^\d+$/.test(right)) {
      return `${t.slice(0, last).replace(/[-_]/g, " ")} / ${right}`;
    }
  }
  return t.replace(/[-_]/g, " ");
}
