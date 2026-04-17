import { NextResponse } from 'next/server';
import { loadScan, scanKey } from '@/lib/scan/cache';
import { parseRepoIdentifier } from '@/lib/github/files';

export const runtime = 'nodejs';

/**
 * Returns the cached ScanResult for a repo. Called by dashboard pages after
 * the SSE stream emits `done`.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('repo') ?? '';
  const ref = parseRepoIdentifier(raw);
  if (!ref) return NextResponse.json({ error: 'Invalid repo' }, { status: 400 });
  const data = loadScan(scanKey(ref.owner, ref.name));
  if (!data) return NextResponse.json({ error: 'Not scanned' }, { status: 404 });
  return NextResponse.json(data);
}
