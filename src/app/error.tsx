'use client';

import { useEffect } from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[autodsm] root error boundary', error);
  }, [error]);

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        className="max-w-[420px] w-full rounded-xl border p-8 text-center"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <h1 className="type-h2 mb-2">Something went wrong</h1>
        <p className="type-body-s mb-6" style={{ color: 'var(--text-secondary)' }}>
          An unexpected error interrupted this page. You can try again or head back to the dashboard.
        </p>
        {error?.digest && (
          <p className="type-mono mb-6" style={{ color: 'var(--text-tertiary)' }}>
            ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-[14px] font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-[14px] font-medium border"
            style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
