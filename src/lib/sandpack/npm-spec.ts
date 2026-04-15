/**
 * Map an import specifier to the top-level npm package name used in package.json
 * (e.g. `date-fns/format` → `date-fns`, `@radix-ui/react-dialog` → `@radix-ui/react-dialog`).
 */
export function npmInstallPackageName(specifier: string): string {
  const s = specifier.trim();
  if (!s || s.startsWith(".") || s.startsWith("@/") || s.startsWith("~/")) return s;
  if (s.startsWith("@")) {
    const rest = s.slice(1);
    const slash = rest.indexOf("/");
    if (slash === -1) return s;
    const scope = rest.slice(0, slash);
    const after = rest.slice(slash + 1);
    const slash2 = after.indexOf("/");
    if (slash2 === -1) return s;
    return `@${scope}/${after.slice(0, slash2)}`;
  }
  const slash = s.indexOf("/");
  if (slash === -1) return s;
  return s.slice(0, slash);
}
