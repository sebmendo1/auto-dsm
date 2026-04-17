/**
 * Process-local scan cache. In production this is replaced by Supabase
 * reads; in V1 we keep results in-memory per server instance so the scanning
 * screen → dashboard hand-off works without a DB round-trip.
 *
 * Keyed by `owner/name`. LRU-ish: capped at 10 entries.
 */

import type { ScanResult } from './orchestrator';

const STORE = new Map<string, { at: number; value: ScanResult }>();
const MAX = 10;

export function saveScan(key: string, value: ScanResult) {
  STORE.set(key, { at: Date.now(), value });
  if (STORE.size > MAX) {
    const oldest = Array.from(STORE.entries()).sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) STORE.delete(oldest[0]);
  }
}

export function loadScan(key: string): ScanResult | null {
  return STORE.get(key)?.value ?? null;
}

export function scanKey(owner: string, name: string) {
  return `${owner.toLowerCase()}/${name.toLowerCase()}`;
}
