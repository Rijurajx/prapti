-- PRAPTI migration 0001: foundation.
-- Creates user_profiles and the self citizen_profiles row, the signup trigger,
-- and row level security. Next migration is 0002_profile_sections (not yet written).

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- user_profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'bn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- citizen_profiles: people a user manages; the owner's own record is 'self'
-- ---------------------------------------------------------------------------
create table public.citizen_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  relationship_to_owner text not null default 'self' check (relationship_to_owner in ('self')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index citizen_profiles_one_self_per_owner
  on public.citizen_profiles (owner_user_id)
  where relationship_to_owner = 'self';

create trigger citizen_profiles_set_updated_at
  before update on public.citizen_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signup: create the user profile and the self citizen profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Citizen');

  insert into public.user_profiles (id, full_name)
  values (new.id, v_name)
  on conflict do nothing;

  insert into public.citizen_profiles (owner_user_id, display_name, relationship_to_owner)
  values (new.id, v_name, 'self')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.user_profiles enable row level security;
alter table public.citizen_profiles enable row level security;

create policy "user_profiles_select_own"
  on public.user_profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "user_profiles_update_own"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "citizen_profiles_select_own"
  on public.citizen_profiles for select
  to authenticated
  using (auth.uid() = owner_user_id);

create policy "citizen_profiles_insert_own"
  on public.citizen_profiles for insert
  to authenticated
  with check (auth.uid() = owner_user_id);

create policy "citizen_profiles_update_own"
  on public.citizen_profiles for update
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);
