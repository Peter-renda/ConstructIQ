-- ConstructIQ — Supabase Schema
-- Run this entire file in the Supabase SQL Editor (Database → SQL Editor → New query)
--
-- NOTE: In Supabase Dashboard → Authentication → Settings, set
--   "Enable email confirmations" to OFF for dev/internal use so sign-up
--   creates a session immediately. Turn it back on for production.

-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  company_role text default 'user',
  status text default 'pending',
  is_master_admin boolean default false,
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, company_role, status, is_master_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'company_role', 'user'),
    'pending',
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table profiles enable row level security;
create policy "auth_all" on profiles for all to authenticated using (true) with check (true);


-- ─── PROJECTS ───────────────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job_number text,
  address text,
  city text,
  state text,
  zip text,
  county text,
  stage text default 'pre-construction',
  description text,
  sector text,
  contract_value numeric default 0,
  start_date date,
  actual_start_date date,
  completion_date date,
  projected_finish_date date,
  warranty_start_date date,
  warranty_end_date date,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

alter table projects enable row level security;
create policy "auth_all" on projects for all to authenticated using (true) with check (true);


-- ─── PROJECT MEMBERS ────────────────────────────────────────────────────────
create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'user',
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

create index if not exists project_members_project_id_idx on project_members(project_id);
create index if not exists project_members_user_id_idx on project_members(user_id);

alter table project_members enable row level security;
create policy "auth_all" on project_members for all to authenticated using (true) with check (true);


-- ─── DIRECTORY USERS ────────────────────────────────────────────────────────
create table if not exists dir_users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  title text,
  role text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists dir_users_project_id_idx on dir_users(project_id);

alter table dir_users enable row level security;
create policy "auth_all" on dir_users for all to authenticated using (true) with check (true);


-- ─── DIRECTORY COMPANIES ────────────────────────────────────────────────────
create table if not exists dir_companies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  name text not null,
  type text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  email text,
  website text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists dir_companies_project_id_idx on dir_companies(project_id);

alter table dir_companies enable row level security;
create policy "auth_all" on dir_companies for all to authenticated using (true) with check (true);


-- ─── DISTRIBUTION GROUPS ────────────────────────────────────────────────────
create table if not exists dist_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  name text not null,
  description text,
  members jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists dist_groups_project_id_idx on dist_groups(project_id);

alter table dist_groups enable row level security;
create policy "auth_all" on dist_groups for all to authenticated using (true) with check (true);


-- ─── DOCUMENTS ──────────────────────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  parent_id uuid references documents on delete cascade,
  name text not null,
  type text not null,
  file_data text,
  created_at timestamptz default now()
);

create index if not exists documents_project_id_idx on documents(project_id);
create index if not exists documents_parent_id_idx on documents(parent_id);

alter table documents enable row level security;
create policy "auth_all" on documents for all to authenticated using (true) with check (true);


-- ─── TASKS ──────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  task_number integer,
  title text not null,
  status text default 'open',
  category text,
  description text,
  distribution_list jsonb default '[]'::jsonb,
  attachments jsonb default '[]'::jsonb,
  assigned_to text,
  due_date date,
  priority text,
  created_at timestamptz default now()
);

create index if not exists tasks_project_id_idx on tasks(project_id);

alter table tasks enable row level security;
create policy "auth_all" on tasks for all to authenticated using (true) with check (true);


-- ─── RFIS ───────────────────────────────────────────────────────────────────
create table if not exists rfis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  rfi_number integer,
  subject text not null,
  status text default 'open',
  question text,
  due_date date,
  responses jsonb default '[]'::jsonb,
  rfi_manager uuid,
  received_from uuid,
  assignees jsonb default '[]'::jsonb,
  distribution_list jsonb default '[]'::jsonb,
  responsible_contractor uuid,
  specification uuid,
  drawing_number text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists rfis_project_id_idx on rfis(project_id);

alter table rfis enable row level security;
create policy "auth_all" on rfis for all to authenticated using (true) with check (true);


-- ─── SUBMITTALS ─────────────────────────────────────────────────────────────
create table if not exists submittals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  submittal_number integer,
  title text not null,
  status text default 'open',
  type text,
  description text,
  spec_section text,
  assignee uuid,
  due_date date,
  created_at timestamptz default now()
);

create index if not exists submittals_project_id_idx on submittals(project_id);

alter table submittals enable row level security;
create policy "auth_all" on submittals for all to authenticated using (true) with check (true);


-- ─── SPECIFICATIONS ─────────────────────────────────────────────────────────
-- NOTE: column is "number" (the CSI spec section number, e.g. "03300"),
-- not "section" — matches the app's specForm.number / spec.number fields.
create table if not exists specifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  number text,
  title text,
  description text,
  status text,
  created_at timestamptz default now()
);

create index if not exists specifications_project_id_idx on specifications(project_id);

alter table specifications enable row level security;
create policy "auth_all" on specifications for all to authenticated using (true) with check (true);


-- ─── ACTIVITY FEED ──────────────────────────────────────────────────────────
create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  type text,
  action text,
  details text,
  user_id uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

create index if not exists activity_feed_project_id_idx on activity_feed(project_id);
create index if not exists activity_feed_created_at_idx on activity_feed(created_at desc);

alter table activity_feed enable row level security;
create policy "auth_all" on activity_feed for all to authenticated using (true) with check (true);
