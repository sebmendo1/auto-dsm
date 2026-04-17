import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from './env';

export type SessionUpdate = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refreshes the Auth session in middleware. Must run before any logic that depends on `user`.
 * Always return `response` from root `middleware.ts` so refreshed cookies are applied.
 */
export async function updateSession(request: NextRequest): Promise<SessionUpdate> {
  if (!isSupabaseConfigured()) {
    return { response: NextResponse.next({ request }), user: null };
  }

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }: { name: string; value: string }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(
          ({ name, value, options }: { name: string; value: string; options: CookieOptions }) =>
            supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
