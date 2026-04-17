'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublishableKey, getSupabaseUrl } from './env';

/**
 * Client Components — PKCE + cookie session via @supabase/ssr.
 */
export function createClient() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key');
  }
  return createBrowserClient(url, key);
}
