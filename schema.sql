-- ============================================================================
-- Ops Console — Supabase schema
-- Run in: Supabase dashboard → SQL Editor → New query → paste → Run.
-- Until you run this, the app works fully on each device's localStorage.
-- ============================================================================

create table if not exists ops_reports (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,                 -- team leader name (from roster)
  role         text not null,                 -- 'core-ops' | 'cash-ops' | 'network-ops' | 'governance'
  report_date  date not null,                 -- the shift's date
  shift        text default 'Day',
  arrival      text,                          -- 'HH:MM' time of arrival (clock-in)
  departure    text,                          -- 'HH:MM' time clocked out
  metrics      jsonb default '{}'::jsonb,     -- { metric_key: number, ... }
  activities   jsonb default '[]'::jsonb,     -- [ { text, theme }, ... ]
  notes        jsonb default '{}'::jsonb,     -- { category_key: "note", ... }
  highlights   jsonb default '{}'::jsonb,     -- { win, blocker, blocker_action, celebrate, concern }
  raw          text,                          -- original pasted report
  submitted_at timestamptz default now(),
  -- one report per person per day (re-submitting updates it)
  unique (name, report_date)
);

create index if not exists ops_reports_date_idx on ops_reports (report_date);
create index if not exists ops_reports_name_idx on ops_reports (name);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- POC posture: this is an internal trusted tool using the public anon key and
-- "pick your name" identity, so we allow anon read/write to ops_reports ONLY.
-- Tighten later by moving to Supabase Auth and scoping policies to auth.uid().
-- ----------------------------------------------------------------------------
alter table ops_reports enable row level security;

drop policy if exists "ops anon read"   on ops_reports;
drop policy if exists "ops anon write"  on ops_reports;
drop policy if exists "ops anon update" on ops_reports;

drop policy if exists "ops anon delete" on ops_reports;

create policy "ops anon read"   on ops_reports for select to anon, authenticated using (true);
create policy "ops anon write"  on ops_reports for insert to anon, authenticated with check (true);
create policy "ops anon update" on ops_reports for update to anon, authenticated using (true) with check (true);
create policy "ops anon delete" on ops_reports for delete to anon, authenticated using (true);

-- ----------------------------------------------------------------------------
-- Shared task library — the selectable tasks (with icons) leaders pick from.
-- New tasks added in the UI are archived here so everyone sees them next time.
-- ----------------------------------------------------------------------------
create table if not exists ops_tasks (
  id         text primary key,            -- slug of label
  label      text not null,
  theme      text default 'other',        -- activity theme key
  icon       text default '📌',
  created_at timestamptz default now()
);

alter table ops_tasks enable row level security;
drop policy if exists "tasks anon read"  on ops_tasks;
drop policy if exists "tasks anon write" on ops_tasks;
create policy "tasks anon read"  on ops_tasks for select to anon, authenticated using (true);
create policy "tasks anon write" on ops_tasks for insert to anon, authenticated with check (true);

-- Done. ops_reports upserts on (name, report_date); ops_tasks upserts on id.
