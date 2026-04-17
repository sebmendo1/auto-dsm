import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

function safeInternalPath(next: string | null, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const oauthErr = url.searchParams.get('error');
  const oauthDesc = url.searchParams.get('error_description');
  if (oauthErr) {
    const q = new URLSearchParams({ error: 'auth', reason: oauthDesc || oauthErr });
    return NextResponse.redirect(new URL(`/login?${q}`, origin));
  }

  const code = url.searchParams.get('code');
  const nextRaw = url.searchParams.get('next');
  const next = safeInternalPath(nextRaw, '/dashboard');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const q = new URLSearchParams({ error: 'auth', reason: error.message });
    return NextResponse.redirect(new URL(`/login?${q}`, origin));
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
