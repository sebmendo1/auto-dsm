-- autoDSM Brand Book Edition schema (PDF §15)
-- Table names are suffixed to coexist alongside legacy component-rendering tables.

-- ───────── app_users ─────────
create table if not exists public.app_users (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  github_login text,
  github_installation_id bigint,
  default_theme text default 'dark',
  created_at timestamptz default now()
);

alter table public.app_users enable row level security;

create policy "users_self_select" on public.app_users
  for select to authenticated using (auth.uid() = id);
create policy "users_self_insert" on public.app_users
  for insert to authenticated with check (auth.uid() = id);
create policy "users_self_update" on public.app_users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ───────── brand_repos ─────────
create table if not exists public.brand_repos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.app_users(id) on delete cascade not null,
  provider text default 'github',
  owner text not null,
  name text not null,
  default_branch text default 'main',
  is_public boolean default true,
  framework text,
  last_scanned_sha text,
  last_scanned_at timestamptz,
  scan_status text default 'pending',
  unsupported_reason text,
  brand_profile jsonb,
  created_at timestamptz default now(),
  unique(user_id, owner, name)
);

create index if not exists brand_repos_public_slug_idx
  on public.brand_repos (owner, name) where is_public = true;

alter table public.brand_repos enable row level security;

create policy "brand_repos_owner_write" on public.brand_repos
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brand_repos_public_read" on public.brand_repos
  for select to anon, authenticated
  using (is_public = true or auth.uid() = user_id);

-- ───────── brand_waitlist ─────────
create table if not exists public.brand_waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  framework text,
  repo text,
  created_at timestamptz default now()
);

alter table public.brand_waitlist enable row level security;

create policy "waitlist_anon_insert" on public.brand_waitlist
  for insert to anon, authenticated with check (true);

-- ───────── brand_scan_logs ─────────
create table if not exists public.brand_scan_logs (
  id uuid default gen_random_uuid() primary key,
  repo_id uuid references public.brand_repos(id) on delete cascade,
  event text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table public.brand_scan_logs enable row level security;

create policy "scan_logs_owner_read" on public.brand_scan_logs
  for select to authenticated
  using (exists (
    select 1 from public.brand_repos r
    where r.id = brand_scan_logs.repo_id and r.user_id = auth.uid()
  ));

-- ───────── trigger: create app_users on auth signup ─────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users (id, email, full_name, avatar_url, github_login)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
