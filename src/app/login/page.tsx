'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  function proceed() {
    // In V1 we bypass real auth and let the user straight through. Supabase
    // wires in when the user provides env vars. See docs/DEPLOYMENT.md.
    let target = '/onboarding';
    try {
      const pending = sessionStorage.getItem('autodsm.pendingRepo');
      if (pending) target = `/onboarding/scanning?repo=${encodeURIComponent(pending)}`;
    } catch {}
    router.push(target);
  }

  return (
    <main className="min-h-screen flex items-center justify-center surface-primary px-4">
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

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={proceed}
            className="h-11 w-full rounded-lg border border-t-default bg-[var(--bg-primary)] text-t-primary flex items-center justify-center gap-2 font-medium text-[14px] hover:bg-[var(--bg-tertiary)] transition-base"
          >
            <Github size={18} strokeWidth={1.5} />
            Continue with GitHub
          </button>
          <button
            onClick={proceed}
            className="h-11 w-full rounded-lg border border-t-default bg-transparent text-t-primary flex items-center justify-center gap-2 font-medium text-[14px] hover:bg-[var(--bg-tertiary)] transition-base"
          >
            <GoogleGlyph />
            Continue with Google
          </button>
        </div>

        <p className="mt-6 text-center text-[12px] text-t-tertiary">
          By continuing you agree to the{' '}
          <a href="/legal/terms" className="underline underline-offset-2 hover:text-t-secondary">Terms</a> and{' '}
          <a href="/legal/privacy" className="underline underline-offset-2 hover:text-t-secondary">Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.9 0 7.4 1.4 10.1 3.6l7.5-7.5C37.3 1.7 31 0 24 0 14.7 0 6.7 5.4 2.9 13.3l8.6 6.7C13.4 14 18.3 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.2-3.2-.4-4.7H24v9h12.5c-.5 2.9-2.1 5.3-4.5 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16.8z"/>
      <path fill="#FBBC05" d="M11.5 28.4c-.6-1.8-1-3.7-1-5.7s.4-3.9 1-5.7L2.9 10.3C1 14 0 18.4 0 24c0 5.6 1 10 2.9 13.7l8.6-6.7z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-5.7 0-10.6-4.5-12.5-10.6l-8.6 6.7C6.7 42.6 14.7 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}
