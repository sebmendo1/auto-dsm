'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[autodsm] dashboard error boundary', error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center px-6">
      <div
        className="max-w-[420px] w-full rounded-xl border p-6 text-center"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}
      >
        <h2 className="type-h3 mb-2">This view couldn&apos;t load</h2>
        <p className="type-body-s mb-5" style={{ color: 'var(--text-secondary)' }}>
          {error?.message || 'An unexpected error occurred rendering this dashboard page.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg px-4 py-2 text-[14px] font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
