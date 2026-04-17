'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useScanStore } from '@/stores/scan';

/**
 * On first visit to any /dashboard route, read the ?repo= query param (or
 * sessionStorage fallback) and hydrate the client-side scan store by fetching
 * the cached result from the server.
 */
export function ScanBoot({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const { repo, result, load, error } = useScanStore();

  useEffect(() => {
    const fromQuery = params.get('repo');
    const fromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('autodsm.pendingRepo') : null;
    const target = fromQuery ?? fromStorage;
    if (!target) {
      router.replace('/onboarding');
      return;
    }
    if (!repo || repo !== target) {
      load(target);
    }
  }, [params, repo, load, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div className="max-w-md">
          <p className="text-[14px] text-t-secondary">{error}</p>
          <a
            href="/onboarding"
            className="mt-4 inline-block text-[13px] text-t-primary underline underline-offset-4"
          >
            ← Connect a repository
          </a>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-t-default border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
