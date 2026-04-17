'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAppOrigin } from './app-origin';

/** GitHub scopes for Supabase Auth — profile + verified email (helps account linking and JWT claims). */
const GITHUB_AUTH_SCOPES = 'read:user user:email';

/**
 * Start GitHub OAuth (PKCE). Always performs a full navigation to GitHub so the flow is reliable across browsers.
 */
export async function signInWithGitHubOAuth(
  supabase: SupabaseClient,
  nextPath: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const origin = getAppOrigin();
  if (!origin) {
    return { ok: false, message: 'Could not resolve app URL (open this page in a browser).' };
  }

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      scopes: GITHUB_AUTH_SCOPES,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data?.url) {
    return { ok: false, message: 'GitHub sign-in did not return a redirect URL. Check Supabase GitHub provider settings.' };
  }

  window.location.assign(data.url);
  return { ok: true };
}
