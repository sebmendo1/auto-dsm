'use client';

import { create } from 'zustand';
import type { ScanResult } from '@/lib/scan/orchestrator';

interface ScanStore {
  repo: string | null;
  result: ScanResult | null;
  loading: boolean;
  error: string | null;
  load: (repo: string) => Promise<void>;
  clear: () => void;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  repo: null,
  result: null,
  loading: false,
  error: null,
  async load(repo: string) {
    if (get().repo === repo && get().result) return;
    set({ loading: true, error: null, repo });
    try {
      const r = await fetch(`/api/scan/result?repo=${encodeURIComponent(repo)}`);
      if (!r.ok) throw new Error('No scan available. Connect a repo to get started.');
      const data = (await r.json()) as ScanResult;
      set({ result: data, loading: false });
    } catch (err) {
      set({ error: String((err as Error).message ?? err), loading: false });
    }
  },
  clear() {
    set({ repo: null, result: null, error: null, loading: false });
  },
}));
