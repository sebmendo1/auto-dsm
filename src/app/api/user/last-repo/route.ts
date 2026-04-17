import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { parseRepoIdentifier } from '@/lib/github/files';

const REPO = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ last_repo: null as string | null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ last_repo: null as string | null });
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('last_repo')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ last_repo: null as string | null });
  }

  return NextResponse.json({ last_repo: data?.last_repo ?? null });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { repo?: string };
  try {
    body = (await request.json()) as { repo?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const repo = (body.repo ?? '').trim();
  const ref = parseRepoIdentifier(repo);
  if (!ref || !REPO.test(`${ref.owner}/${ref.name}`)) {
    return NextResponse.json({ ok: false, error: 'Invalid repo' }, { status: 400 });
  }

  const normalized = `${ref.owner}/${ref.name}`;
  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_id: user.id,
      last_repo: normalized,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
