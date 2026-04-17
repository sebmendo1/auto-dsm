'use client';

import Image from 'next/image';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Github } from 'lucide-react';
import { toast } from 'sonner';
import { getAppOrigin } from '@/lib/auth/app-origin';
import { signInWithGitHubOAuth } from '@/lib/auth/github-oauth';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center surface-primary px-4">
      <div className="h-8 w-8 rounded-full border-2 border-t-default border-t-transparent animate-spin" />
    </main>
  );
}

function buildPostLoginPath(searchParams: URLSearchParams): string {
  const raw = searchParams.get('next');
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  try {
    const p = sessionStorage.getItem('autodsm.pendingRepo');
    if (p) return `/dashboard?repo=${encodeURIComponent(p)}`;
  } catch {
    /* ignore */
  }
  return '/dashboard';
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const authErrorToastShown = useRef(false);

  const redirectAfterSession = useCallback(async () => {
    const raw = searchParams.get('next');
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
      router.replace(raw);
      return;
    }
    try {
      const p = sessionStorage.getItem('autodsm.pendingRepo');
      if (p) {
        router.replace(`/dashboard?repo=${encodeURIComponent(p)}`);
        return;
      }
    } catch {
      /* ignore */
    }
    try {
      const r = await fetch('/api/user/last-repo');
      const j = (await r.json()) as { last_repo?: string | null };
      if (j.last_repo) {
        router.replace(`/dashboard?repo=${encodeURIComponent(j.last_repo)}`);
        return;
      }
    } catch {
      /* ignore */
    }
    router.replace('/dashboard');
  }, [router, searchParams]);

  useEffect(() => {
    if (authErrorToastShown.current) return;
    if (searchParams.get('error') === 'auth') {
      authErrorToastShown.current = true;
      const reason = searchParams.get('reason');
      toast.error('Authentication failed', {
        description: reason
          ? decodeURIComponent(reason.replace(/\+/g, ' '))
          : 'Try again or pick a different sign-in method.',
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session) return;
      void redirectAfterSession();
    });
    return () => {
      cancelled = true;
    };
  }, [redirectAfterSession]);

  async function oauth(provider: 'github' | 'google') {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured', {
        description: 'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
      });
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const next = buildPostLoginPath(searchParams);

      if (provider === 'github') {
        const result = await signInWithGitHubOAuth(supabase, next);
        if (!result.ok) {
          throw new Error(result.message);
        }
        return;
      }

      const origin = getAppOrigin();
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error('Google sign-in did not return a redirect URL.');
    } catch (e) {
      toast.error('Sign-in failed', { description: String((e as Error).message ?? e) });
      setBusy(false);
    }
  }

  async function emailPassword() {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured');
      return;
    }
    if (!email.trim() || !password) {
      toast.error('Enter email and password');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getAppOrigin()}/auth/callback?next=${encodeURIComponent(buildPostLoginPath(searchParams))}`,
          },
        });
        if (error) throw error;
        toast.success('Check your email', { description: 'Confirm your account if required, then sign in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await redirectAfterSession();
      }
    } catch (e) {
      toast.error(mode === 'signup' ? 'Sign up failed' : 'Sign in failed', {
        description: String((e as Error).message ?? e),
      });
    } finally {
      setBusy(false);
    }
  }

  async function magicLink() {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured');
      return;
    }
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const next = buildPostLoginPath(searchParams);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${getAppOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      toast.success('Magic link sent', { description: 'Check your inbox.' });
    } catch (e) {
      toast.error('Could not send link', { description: String((e as Error).message ?? e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center surface-primary px-4 py-10">
      <div
        className="w-full max-w-[420px] rounded-2xl border border-t-default p-6 md:p-10"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="flex justify-center">
          <Image src="/brand/autodsm-icon-light.svg" alt="autoDSM" width={32} height={32} />
        </div>
        <h1 className="mt-6 text-center font-display font-semibold text-[24px] text-t-primary">
          Sign in to autoDSM
        </h1>
        <p className="mt-2 text-center text-[14px] text-t-secondary">
          Connect your design system in under a minute.
        </p>

        {!isSupabaseConfigured() && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="rounded-lg border border-t-default bg-[var(--bg-tertiary)] px-3 py-2 text-[12px] text-t-secondary">
              Add <span className="font-mono text-t-primary">NEXT_PUBLIC_SUPABASE_URL</span> and{' '}
              <span className="font-mono text-t-primary">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span> to{' '}
              <span className="font-mono">.env.local</span> to enable authentication.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                const next = buildPostLoginPath(searchParams);
                router.push(next);
              }}
            >
              Continue without sign-in (local dev)
            </Button>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void oauth('github')}
            className="h-11 w-full rounded-lg border border-t-default bg-[var(--bg-primary)] text-t-primary flex items-center justify-center gap-2 font-medium text-[14px] hover:bg-[var(--bg-tertiary)] transition-base disabled:opacity-50"
          >
            <Github size={18} strokeWidth={1.5} />
            {busy ? 'Redirecting to GitHub…' : 'Continue with GitHub'}
          </button>
          <p className="text-[11px] text-t-tertiary text-center leading-relaxed px-1">
            Uses the GitHub provider in your Supabase project (read profile + email). Enable it under Authentication →
            Providers, and set the GitHub OAuth app callback to Supabase&apos;s URL shown there.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void oauth('google')}
            className="h-11 w-full rounded-lg border border-t-default bg-transparent text-t-primary flex items-center justify-center gap-2 font-medium text-[14px] hover:bg-[var(--bg-tertiary)] transition-base disabled:opacity-50"
          >
            <GoogleGlyph />
            Continue with Google
          </button>
        </div>

        <div className="mt-8 border-t border-t-subtle pt-8 flex flex-col gap-3">
          <label className="text-[13px] font-medium text-t-secondary">Email</label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
          <label className="text-[13px] font-medium text-t-secondary">Password</label>
          <Input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
          <Button type="button" className="w-full" size="lg" disabled={busy} onClick={() => void emailPassword()}>
            {mode === 'signin' ? 'Sign in with password' : 'Create account'}
          </Button>
          <p className="text-center text-[12px] text-t-tertiary">
            <button
              type="button"
              className="underline underline-offset-2 hover:text-t-secondary"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Create an account instead' : 'Already have an account? Sign in'}
            </button>
          </p>
          <Button type="button" variant="ghost" className="w-full text-t-secondary" disabled={busy} onClick={() => void magicLink()}>
            Email me a magic link
          </Button>
        </div>

        <p className="mt-6 text-center text-[12px] text-t-tertiary">
          By continuing you agree to the{' '}
          <a href="/legal/terms" className="underline underline-offset-2 hover:text-t-secondary">
            Terms
          </a>{' '}
          and{' '}
          <a href="/legal/privacy" className="underline underline-offset-2 hover:text-t-secondary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.9 0 7.4 1.4 10.1 3.6l7.5-7.5C37.3 1.7 31 0 24 0 14.7 0 6.7 5.4 2.9 13.3l8.6 6.7C13.4 14 18.3 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.2-3.2-.4-4.7H24v9h12.5c-.5 2.9-2.1 5.3-4.5 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16.8z" />
      <path fill="#FBBC05" d="M11.5 28.4c-.6-1.8-1-3.7-1-5.7s.4-3.9 1-5.7L2.9 10.3C1 14 0 18.4 0 24c0 5.6 1 10 2.9 13.7l8.6-6.7z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-5.7 0-10.6-4.5-12.5-10.6l-8.6 6.7C6.7 42.6 14.7 48 24 48z" />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
