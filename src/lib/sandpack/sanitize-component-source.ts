/** Remove `@/` and `@scope/...` imports Sandpack cannot resolve (entire import line). */
export function stripPathAliasImports(source: string): string {
  return source.replace(
    /^\s*import\s+[^;]*?\s+from\s+["']@[^"']+["'];?\s*$/gm,
    "// [sandbox] omitted path alias import\n",
  );
}

/**
 * Single-file preview fallback: strip path aliases and relative imports (no virtual repo graph).
 */
export function sanitizeComponentSourceForSandpack(source: string): string {
  let out = stripPathAliasImports(source);
  out = out.replace(
    /^\s*import\s+[^;]*?\s+from\s+["']\.\.?\/[^"']+["'];?\s*$/gm,
    "// [preview] omitted relative import — add file to Sandpack or open on GitHub\n",
  );
  return out;
}

/** Strip @tailwind directives from repo CSS when Sandpack already injects them via `/styles.css`. */
export function stripTailwindDirectives(css: string): string {
  return css.replace(/^\s*@tailwind\s+[^;]+;\s*$/gm, "");
}
