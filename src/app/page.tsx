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
      className="min-h-screen flex flex-col"
      style={{ background: '#F4F4F6', color: '#111113' }}
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
            className="flex items-center gap-8 rounded-full bg-white px-6 py-2"
            style={{ boxShadow: '0 1px 2px rgba(17,17,19,0.06), 0 1px 1px rgba(17,17,19,0.04)' }}
          >
            <a href="/login" className="text-[14px] font-medium text-[#111113] hover:text-black transition-colors">Product</a>
            <a href="/login" className="text-[14px] font-medium text-[#111113] hover:text-black transition-colors">Pricing</a>
            <a href="https://github.com/sebmendo1/auto-dsm" target="_blank" rel="noreferrer" className="text-[14px] font-medium text-[#111113] hover:text-black transition-colors">GitHub</a>
          </div>
        </nav>
        <a
          href="/login"
          className="rounded-full bg-[#8F23FA] px-4 py-2 md:px-6 md:py-2.5 text-[13px] md:text-[14px] font-semibold text-white hover:bg-[#7A1DD6] transition-colors"
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
            style={{ letterSpacing: '-0.02em', color: '#111113', maxWidth: 820 }}
          >
            Visualize and maintain your design system with your GitHub repo
          </h1>
          <p
            className="mt-4 text-[17px] leading-[1.5]"
            style={{ color: '#6B6B70' }}
          >
            The design system manager built for the AI era.
          </p>

          <div className="mt-8 w-full max-w-[520px]">
            <div
              className={
                'relative flex h-14 items-center rounded-full bg-white ' +
                (shake ? 'animate-shake' : '')
              }
              style={{ boxShadow: '0 4px 12px rgba(17,17,19,0.06), 0 1px 1px rgba(17,17,19,0.04)' }}
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); setErr(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="Your Github repo"
                aria-label="Your GitHub repo URL"
                className="flex-1 h-full bg-transparent pl-6 pr-2 text-[15px] placeholder:text-[#B8B8BD] outline-none rounded-full"
                style={{ color: '#111113' }}
              />
              <button
                onClick={submit}
                className="mr-1.5 rounded-full bg-[#8F23FA] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#7A1DD6] transition-colors"
              >
                Get started
              </button>
            </div>
            {err && (
              <p className="mt-3 text-[13px]" style={{ color: '#D93036' }}>
                {err}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
