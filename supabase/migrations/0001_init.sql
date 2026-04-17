-- autoDSM V2 schema — initial migration
-- Drafted alongside V1. Not applied in V1 (V1 is stateless/in-memory).
-- See docs/DEPLOYMENT.md for the runbook.

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
create type workspace_plan as enum ('free', 'pro', 'team');
create type scan_status as enum ('queued', 'running', 'ok', 'failed');
create type token_category as enum (
  'colors', 'typography', 'spacing', 'radii', 'shadows',
  'motion', 'breakpoint', 'z-index', 'misc'
);

-- Workspaces -----------------------------------------------------------------
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  plan workspace_plan not null default 'free',
  created_at timestamptz not null default now()
);
create index on workspaces (owner_id);

-- Repos ----------------------------------------------------------------------
create table repos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  full_name text not null,                        -- "owner/name"
  github_installation_id bigint,                  -- null for public/PAT scans
  default_branch text not null default 'main',
  last_scan_id uuid,
  created_at timestamptz not null default now(),
  unique (workspace_id, full_name)
);
create index on repos (workspace_id);

-- Scans ----------------------------------------------------------------------
create table scans (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references repos(id) on delete cascade,
  commit_sha text not null,
  status scan_status not null default 'queued',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  payload jsonb,                                  -- raw ScanResult for rollback
  file_count int,
  component_count int,
  token_count int
);
create index on scans (repo_id, started_at desc);

alter table repos
  add constraint repos_last_scan_fk
  foreign key (last_scan_id) references scans(id) on delete set null;

-- Components -----------------------------------------------------------------
create table components (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  repo_id uuid not null references repos(id) on delete cascade,
  name text not null,
  slug text not null,
  file_path text not null,
  description text,
  source_code text not null,
  render_config jsonb not null,                   -- RenderConfig
  dependencies jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (scan_id, slug)
);
create index on components (repo_id);
create index on components (scan_id);

-- Tokens ---------------------------------------------------------------------
create table tokens (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  repo_id uuid not null references repos(id) on delete cascade,
  name text not null,
  category token_category not null,
  value text not null,
  raw_value text not null,
  source_file text,
  source_line int,
  metadata jsonb not null default '{}'::jsonb
);
create index on tokens (repo_id, category);
create index on tokens (scan_id);

-- Assets (compiled Tailwind, pinned exports) ---------------------------------
create table assets (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references repos(id) on delete cascade,
  kind text not null,                             -- 'tailwind_css', 'tokens_json', ...
  url text not null,
  checksum text,
  created_at timestamptz not null default now()
);
create index on assets (repo_id, kind);

-- RLS ------------------------------------------------------------------------
alter table workspaces enable row level security;
alter table repos      enable row level security;
alter table scans      enable row level security;
alter table components enable row level security;
alter table tokens     enable row level security;
alter table assets     enable row level security;

create policy workspaces_owner on workspaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy repos_by_workspace on repos
  for all using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  ) with check (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

create policy scans_by_repo on scans
  for all using (
    repo_id in (
      select id from repos
      where workspace_id in (select id from workspaces where owner_id = auth.uid())
    )
  );

create policy components_by_repo on components
  for all using (
    repo_id in (
      select id from repos
      where workspace_id in (select id from workspaces where owner_id = auth.uid())
    )
  );

create policy tokens_by_repo on tokens
  for all using (
    repo_id in (
      select id from repos
      where workspace_id in (select id from workspaces where owner_id = auth.uid())
    )
  );

create policy assets_by_repo on assets
  for all using (
    repo_id in (
      select id from repos
      where workspace_id in (select id from workspaces where owner_id = auth.uid())
    )
  );
