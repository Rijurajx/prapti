-- 0002: citizen personal details and address. Depends on 0001_foundation.sql. Never store Aadhaar or any identity-document number.

-- 1. Personal details (one row per citizen)
create table public.citizen_personal_details (
  citizen_id uuid primary key references public.citizen_profiles(id) on delete cascade,
  date_of_birth date,
  gender text check (gender in ('female','male','other','prefer_not_to_say')),
  marital_status text check (marital_status in ('never_married','married','widowed','divorced','separated','prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dob_not_future check (date_of_birth is null or date_of_birth <= current_date),
  constraint dob_plausible check (date_of_birth is null or date_of_birth >= date '1900-01-01')
);

-- 2. Addresses (current and permanent, one each per citizen)
create table public.citizen_addresses (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  kind text not null check (kind in ('current','permanent')),
  state text,
  district text,
  village_or_town text,
  area_type text check (area_type in ('urban','rural')),
  pin_code text check (pin_code is null or pin_code ~ '^[1-9][0-9]{5}$'),
  domicile_confirmed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (citizen_id, kind)
);

-- 3. Triggers (public.set_updated_at() already exists from 0001)
create trigger citizen_personal_details_set_updated_at
  before update on public.citizen_personal_details
  for each row execute function public.set_updated_at();

create trigger citizen_addresses_set_updated_at
  before update on public.citizen_addresses
  for each row execute function public.set_updated_at();

-- 4. Row level security: authenticated owners only, checked through citizen_profiles
alter table public.citizen_personal_details enable row level security;
alter table public.citizen_addresses enable row level security;

create policy "owner can select personal details"
  on public.citizen_personal_details
  for select to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can insert personal details"
  on public.citizen_personal_details
  for insert to authenticated
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can update personal details"
  on public.citizen_personal_details
  for update to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can delete personal details"
  on public.citizen_personal_details
  for delete to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can select addresses"
  on public.citizen_addresses
  for select to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can insert addresses"
  on public.citizen_addresses
  for insert to authenticated
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can update addresses"
  on public.citizen_addresses
  for update to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())))
  with check (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

create policy "owner can delete addresses"
  on public.citizen_addresses
  for delete to authenticated
  using (exists (select 1 from public.citizen_profiles cp where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())));

-- No grants to anon.

-- Adult family members get access only through a later household grant table (0003).
