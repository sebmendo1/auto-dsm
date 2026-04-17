'use client';

/**
 * Normalize `NEXT_PUBLIC_APP_URL` so Supabase never receives a bare hostname
 * (e.g. `www.example.com`), which gets interpreted as a *path* on *.supabase.co
 * and breaks OAuth with: …supabase.co/www.example.com?code=…
 */
export function normalizePublicAppUrl(raw: string): string {
  const t = raw.trim().replace(/\/$/, '');
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  const host = t.replace(/^\/+/, '');
  return `https://${host}`;
}

/**
 * Canonical site origin for OAuth `redirectTo` / email links.
 * Prefer `NEXT_PUBLIC_APP_URL` so Supabase Dashboard redirect allowlists match production and preview URLs.
 */
export function getAppOrigin(): string {
  if (typeof window === 'undefined') return '';
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    return normalizePublicAppUrl(raw);
  }
  return window.location.origin;
}
