import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { proposeDescription } from '@/lib/ai/describe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  component_name: z.string().min(1).max(200),
  source: z.string().min(1).max(40000),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

/**
 * POST /api/ai/description
 *
 * Returns a short plain-prose description for a component. Caches by
 * `(name, source-hash)` in process memory — the same source produces the
 * same description for the life of the server process.
 */
export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const result = await proposeDescription(
    { component_name: parsed.component_name, source: parsed.source },
    { apiKey: parsed.apiKey, model: parsed.model },
  );

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
