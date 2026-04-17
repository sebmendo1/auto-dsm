/**
 * Redact secrets and environment references out of source code that is about
 * to leave the server for an LLM call.
 *
 * Scope: defense-in-depth only. Components ingested by autoDSM are public repo
 * source, so the realistic exposure is a contributor accidentally pasting a
 * key into a string literal. We strip three patterns the master spec calls
 * out:
 *
 *   1. `process.env.ANYTHING` reads are rewritten to `process.env.__REDACTED__`.
 *   2. Bare 32+ character runs of uppercase+digit characters (typical GitHub
 *      PATs, Stripe keys, AWS keys) are replaced with `__REDACTED__`.
 *   3. Common bearer-token shapes (`Bearer <long-token>`,
 *      `Authorization: token <token>`) have the value replaced.
 *
 * All replacements preserve line count so stack traces stay aligned.
 */

const PROCESS_ENV_RE = /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g;
const LONG_SECRET_RE = /\b[A-Z0-9_]{32,}\b/g;
const BEARER_RE = /(bearer|token)\s+[A-Za-z0-9._\-~+/=]{20,}/gi;

export function sanitizeForAI(source: string): string {
  if (!source) return source;
  return source
    .replace(PROCESS_ENV_RE, 'process.env.__REDACTED__')
    .replace(LONG_SECRET_RE, '__REDACTED__')
    .replace(BEARER_RE, '$1 __REDACTED__');
}

export function sanitizeFilesForAI(
  files: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, src] of Object.entries(files)) {
    out[path] = sanitizeForAI(src);
  }
  return out;
}
