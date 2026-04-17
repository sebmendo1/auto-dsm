-- autoDSM — add the four tables the master spec calls for that the V1 schema
-- was missing: commits, agents, render_repair_logs, waitlist.
-- All keep the workspaces/repos ownership chain used by 0001_init.sql.

-- Commits --------------------------------------------------------------------
-- Populated on scan; used by the dashboard "Recent changes" card.
create table commits (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references repos(id) on delete cascade,
  sha text not null,
  message text,
  author text,
  author_avatar text,
  committed_at timestamptz,
  url text,
  touched_files text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (repo_id, sha)
);
create index on commits (repo_id, committed_at desc);

-- Agents ---------------------------------------------------------------------
-- Schema-only in V1 — the UI at /dashboard/agent still returns a hardcoded
-- response. Kept so the V2 wiring does not require a migration.
create table agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  repo_id uuid references repos(id) on delete cascade,
  name text,
  system_prompt text,
  created_at timestamptz not null default now()
);
create index on agents (workspace_id);
create index on agents (repo_id);

-- Render repair logs ---------------------------------------------------------
-- One row per Gemini repair attempt. Enforces the "1 repair per component per
-- scan" cap from the master spec and powers future fine-tuning.
create table render_repair_logs (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references components(id) on delete cascade,
  scan_id uuid not null references scans(id) on delete cascade,
  error_message text,
  patch_json jsonb,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index on render_repair_logs (component_id);
create index on render_repair_logs (scan_id);
create unique index render_repair_logs_one_per_component_per_scan
  on render_repair_logs (component_id, scan_id);

-- Waitlist -------------------------------------------------------------------
-- Anonymous sign-ups from /onboarding/unsupported. Insert-only from anon.
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  framework text,
  repo text,
  created_at timestamptz not null default now()
);
create index on waitlist (created_at desc);

-- RLS ------------------------------------------------------------------------
alter table commits            enable row level security;
alter table agents             enable row level security;
alter table render_repair_logs enable row level security;
alter table waitlist           enable row level security;

create policy commits_by_repo on commits
  for all using (
    repo_id in (
      select id from repos
      where workspace_id in (select id from workspaces where owner_id = auth.uid())
    )
  );

create policy agents_by_workspace on agents
  for all using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  ) with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

create policy repair_logs_by_component on render_repair_logs
  for all using (
    component_id in (
      select id from components
      where repo_id in (
        select id from repos
        where workspace_id in (select id from workspaces where owner_id = auth.uid())
      )
    )
  );

-- Waitlist: anyone (anon or authed) can insert; reads locked down.
create policy waitlist_insert_anon on waitlist
  for insert to anon, authenticated
  with check (true);
