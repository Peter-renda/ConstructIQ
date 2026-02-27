-- ConstructIQ — Column additions (run this in Supabase SQL Editor)
-- Safe to run multiple times — uses "add column if not exists"

-- ─── RFIS ────────────────────────────────────────────────────────────────────
alter table rfis add column if not exists rfi_manager uuid;
alter table rfis add column if not exists received_from uuid;
alter table rfis add column if not exists assignees jsonb default '[]'::jsonb;
alter table rfis add column if not exists distribution_list jsonb default '[]'::jsonb;
alter table rfis add column if not exists responsible_contractor uuid;
alter table rfis add column if not exists specification uuid;
alter table rfis add column if not exists drawing_number text;
alter table rfis add column if not exists attachments jsonb default '[]'::jsonb;

-- ─── TASKS ───────────────────────────────────────────────────────────────────
alter table tasks add column if not exists category text;
alter table tasks add column if not exists distribution_list jsonb default '[]'::jsonb;
alter table tasks add column if not exists attachments jsonb default '[]'::jsonb;

-- ─── SUBMITTALS ──────────────────────────────────────────────────────────────
alter table submittals add column if not exists type text;
alter table submittals add column if not exists assignee uuid;
-- Note: the old "assigned_to" column is unused; assignee is what the form submits

-- ─── PROFILES — APPROVAL / MASTER ADMIN ─────────────────────────────────────
-- Step 1: add with 'approved' so ALL EXISTING users keep access (no disruption)
alter table profiles add column if not exists status text default 'approved';
alter table profiles add column if not exists is_master_admin boolean default false;

-- Step 2: switch default to 'pending' so NEW sign-ups require admin approval
alter table profiles alter column status set default 'pending';

-- After running this migration, promote your admin account:
-- UPDATE profiles SET is_master_admin = true WHERE email = 'you@example.com';
-- (status is already 'approved' for existing users — no need to set it)
