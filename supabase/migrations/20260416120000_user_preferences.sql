-- Per-user workspace pointer (last opened GitHub repo). RLS: own row only.
-- Apply with: supabase db push / migration run against your project.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_repo text,
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is 'autoDSM: last dashboard repo per authenticated user';

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_preferences_insert_own"
  on public.user_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_preferences to authenticated;
