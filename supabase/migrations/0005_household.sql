-- 0005: household grouping, invitations, consent and profile access grants. Depends on 0001-0004. Never store Aadhaar or any identity-document number.

-- 1. Households. Purpose: group citizen profiles of one family under a named household the creator manages.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_by_user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Household members. Purpose: link a citizen profile to a household; the creator manages rows but gets no citizen data here.
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  citizen_profile_id uuid not null references public.citizen_profiles(id) on delete cascade,
  relationship text not null check (relationship in ('self','spouse','child','parent','sibling','other')),
  status text not null default 'active' check (status in ('active','removed')),
  created_at timestamptz not null default now(),
  unique (household_id, citizen_profile_id)
);

-- 3. Household invitations. Purpose: invite an adult by email; only a SHA-256 hash of the token is stored, never the raw token.
create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by_user_id uuid not null references public.user_profiles(id) on delete cascade,
  invitee_email text not null check (position('@' in invitee_email) > 1),
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  created_at timestamptz not null default now()
);

-- 4. Consent records. Purpose: append-only record of what a citizen agreed to share and with whom; revoking sets revoked_at, a new grant inserts a new row.
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  citizen_profile_id uuid not null references public.citizen_profiles(id) on delete cascade,
  grantee_user_id uuid references public.user_profiles(id) on delete cascade,
  scope text not null check (scope in ('household_membership','profile_read','profile_edit')),
  consent_text_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- 5. Profile access grants. Purpose: the concrete access a grantee has to one citizen profile, traced back to the consent that authorised it.
create table public.profile_access_grants (
  id uuid primary key default gen_random_uuid(),
  citizen_profile_id uuid not null references public.citizen_profiles(id) on delete cascade,
  grantee_user_id uuid not null references public.user_profiles(id) on delete cascade,
  access_level text not null check (access_level in ('read','edit')),
  sensitivity_tier text not null default 'standard' check (sensitivity_tier in ('standard','sensitive')),
  source_consent_id uuid not null references public.consent_records(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- 6. Row level security: authenticated users only, ownership checked through citizen_profiles
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.consent_records enable row level security;
alter table public.profile_access_grants enable row level security;

-- households: creator, or an active member whose citizen profile the user owns
create policy "creator or active member can select households"
  on public.households
  for select to authenticated
  using (
    created_by_user_id = (select auth.uid())
    or exists (
      select 1 from public.household_members hm
      join public.citizen_profiles cp on cp.id = hm.citizen_profile_id
      where hm.household_id = id
        and hm.status = 'active'
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "creator can insert households"
  on public.households
  for insert to authenticated
  with check (created_by_user_id = (select auth.uid()));

create policy "creator can delete households"
  on public.households
  for delete to authenticated
  using (created_by_user_id = (select auth.uid()));

-- household_members: the citizen owner or the household creator can see rows; only the creator manages them
create policy "owner or creator can select household members"
  on public.household_members
  for select to authenticated
  using (
    exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid()))
    or exists (select 1 from public.households h where h.id = household_id and h.created_by_user_id = (select auth.uid()))
  );

create policy "creator can insert household members"
  on public.household_members
  for insert to authenticated
  with check (exists (select 1 from public.households h where h.id = household_id and h.created_by_user_id = (select auth.uid())));

create policy "creator can update household members"
  on public.household_members
  for update to authenticated
  using (exists (select 1 from public.households h where h.id = household_id and h.created_by_user_id = (select auth.uid())))
  with check (exists (select 1 from public.households h where h.id = household_id and h.created_by_user_id = (select auth.uid())));

create policy "creator can delete household members"
  on public.household_members
  for delete to authenticated
  using (exists (select 1 from public.households h where h.id = household_id and h.created_by_user_id = (select auth.uid())));

-- household_invitations: only the inviter sees and manages their invitations; invitee acceptance goes through the service path
create policy "inviter can select invitations"
  on public.household_invitations
  for select to authenticated
  using (invited_by_user_id = (select auth.uid()));

create policy "inviter can insert invitations"
  on public.household_invitations
  for insert to authenticated
  with check (invited_by_user_id = (select auth.uid()));

create policy "inviter can update invitations"
  on public.household_invitations
  for update to authenticated
  using (invited_by_user_id = (select auth.uid()))
  with check (invited_by_user_id = (select auth.uid()));

-- consent_records: the citizen owner or the grantee can read; only the owner inserts or revokes
create policy "owner or grantee can select consent records"
  on public.consent_records
  for select to authenticated
  using (
    exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid()))
    or grantee_user_id = (select auth.uid())
  );

create policy "owner can insert consent records"
  on public.consent_records
  for insert to authenticated
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can revoke consent records"
  on public.consent_records
  for update to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())));

-- profile_access_grants: the citizen owner or the grantee can read; only the owner inserts or updates
create policy "owner or grantee can select profile access grants"
  on public.profile_access_grants
  for select to authenticated
  using (
    exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid()))
    or grantee_user_id = (select auth.uid())
  );

create policy "owner can insert profile access grants"
  on public.profile_access_grants
  for insert to authenticated
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can update profile access grants"
  on public.profile_access_grants
  for update to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_profile_id and cp.owner_user_id = (select auth.uid())));

-- No grants to anon. A household creator has no policy path to another adult's citizen data here.
