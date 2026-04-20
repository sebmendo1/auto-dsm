/**
 * Resolve Supabase URL and public API key for server, middleware, and client.
 * Supports both NEXT_PUBLIC_* (browser) and unprefixed names often set by Vercel / Supabase integrations.
 * Never use service_role here — only public anon/publishable keys.
 */

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s.length > 0) return s;
  }
  return undefined;
}

/** Project URL (https://xxx.supabase.co). */
export function getSupabaseUrl(): string | undefined {
  return firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  );
}

/**
 * Public client key: publishable (sb_publishable_...) or legacy anon.
 * Safe to expose to the browser; same as Supabase dashboard "anon" / "publishable".
 */
export function getSupabasePublicKey(): string | undefined {
  return firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}

export function requireSupabasePublicConfig(): { url: string; key: string } {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a public key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY). On Vercel you can also use SUPABASE_URL and SUPABASE_ANON_KEY from the Supabase integration — then redeploy.",
    );
  }
  return { url, key };
}
