-- ==========================================================================
-- Stellar Forge — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================================================

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  company text,
  service_interest text,
  budget_range text,
  message text not null,
  source_page text,
  status text not null default 'new', -- new | contacted | qualified | closed
  read boolean not null default false
);

comment on table public.enquiries is 'Project enquiries submitted via the Stellar Forge contact form.';

-- Enable Row Level Security
alter table public.enquiries enable row level security;

-- Allow anyone (anon key) to INSERT a new enquiry — this is what the public
-- contact form uses. No one can insert on behalf of others because there is
-- no user-linked column being spoofed; it's a simple public write endpoint.
create policy "Public can submit enquiries"
  on public.enquiries
  for insert
  to anon
  with check (true);

-- Only authenticated users (i.e. you, logged into /admin) can read enquiries.
create policy "Authenticated users can read enquiries"
  on public.enquiries
  for select
  to authenticated
  using (true);

-- Only authenticated users can update status/read flags from the admin page.
create policy "Authenticated users can update enquiries"
  on public.enquiries
  for update
  to authenticated
  using (true)
  with check (true);

-- Helpful index for the admin dashboard sort/filter
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

-- ==========================================================================
-- Creating your admin login
-- ==========================================================================
-- Go to Supabase Dashboard → Authentication → Users → Add User, and create
-- yourself an email + password. Use those credentials to sign in at
-- /admin/ on the live site. Do NOT enable public sign-ups for this project —
-- the admin login form only calls signInWithPassword, never signUp.
