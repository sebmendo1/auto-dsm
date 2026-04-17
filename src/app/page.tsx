'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { parseRepoIdentifier } from '@/lib/github/files';

/**
 * Landing page — light mode only (matches the provided Figma).
 * Intentionally sparse: top bar, centered hero, single input composite.
 */

export default function LandingPage() {
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function submit() {
    setErr(null);
    if (!value.trim()) {
      setShake(true);
      inputRef.current?.focus();
      setTimeout(() => setShake(false), 260);
      return;
    }
    const ref = parseRepoIdentifier(value);
    if (!ref) {
      setErr("That doesn't look like a GitHub repo URL.");
      return;
    }
    const normalized = `${ref.owner}/${ref.name}`;
    try {
      sessionStorage.setItem('autodsm.pendingRepo', normalized);
    } catch {
      /* ignore */
    }
    const next = encodeURIComponent(`/onboarding/scanning?repo=${encodeURIComponent(normalized)}`);
    router.push(`/login?next=${next}`);
  }

  return (
    <main
      className="theme-force-light min-h-screen flex flex-col"
      style={{ background: 'var(--landing-bg)', color: 'var(--text-primary)' }}
    >
      {/* Top bar */}
      <header className="h-[72px] flex items-center justify-between px-4 md:px-8">
        <a href="/" className="flex items-center gap-2" aria-label="autoDSM home">
          <Image
            src="/brand/autodsm-wordmark-light.svg"
            alt="autoDSM"
            width={240}
            height={48}
            priority
            className="h-12 w-fit"
          />
        </a>
        <nav className="hidden md:block mx-auto">
          <div
            className="flex items-center gap-8 rounded-full px-6 py-2"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <a href="#product" className="type-body font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Product</a>
            <a href="#workflows" className="type-body font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Workflows</a>
            <a href="#benefits" className="type-body font-medium transition-colors hover:opacity-80" style={{ color: 'var(--text-primary)' }}>Benefits</a>
          </div>
        </nav>
        <a
          href="/login"
          className="rounded-full px-4 py-2 md:px-6 md:py-2.5 text-[13px] md:text-[14px] font-semibold transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          Log in
        </a>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-start justify-center">
        <div
          className="w-full max-w-[820px] flex flex-col items-center text-center px-6 pt-[8vh] md:pt-[14vh]"
        >
          <h1
            className="font-display font-bold text-[32px] md:text-[44px] leading-[1.1]"
            style={{ letterSpacing: '-0.02em', color: 'var(--text-primary)', maxWidth: 820 }}
          >
            Visualize and maintain your design system with your GitHub repo
          </h1>
          <p
            className="mt-4 text-[17px] leading-[1.5]"
            style={{ color: 'var(--text-secondary)' }}
          >
            The design system manager built for the AI era.
          </p>

          <div className="mt-8 w-full max-w-[520px]">
            <div
              className={
                'relative flex h-14 items-center rounded-full ' +
                (shake ? 'animate-shake' : '')
              }
              style={{ background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-md)' }}
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); setErr(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="Your Github repo"
                aria-label="Your GitHub repo URL"
                className="flex-1 h-full bg-transparent pl-6 pr-2 text-[15px] outline-none rounded-full placeholder:text-[color:var(--text-placeholder)]"
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={submit}
                className="mr-1.5 rounded-full px-6 py-2.5 text-[14px] font-semibold transition-colors"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              >
                Get started
              </button>
            </div>
            {err && (
              <p className="mt-3 text-[13px]" style={{ color: 'var(--error)' }}>
                {err}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
