import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

const Body = z.object({
  email: z.string().email().max(320),
  framework: z.string().max(80).optional(),
  repo: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  // Local dev without Supabase configured: log and accept so the UI still works.
  if (!isSupabaseConfigured()) {
    console.info('[waitlist] (no-supabase) would persist', parsed);
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('waitlist').insert({
    email: parsed.email,
    framework: parsed.framework ?? null,
    repo: parsed.repo ?? null,
  });

  if (error) {
    console.error('[waitlist] insert failed', error);
    return NextResponse.json({ ok: false, error: 'insert_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
