-- 0004: agricultural profile. Depends on 0001 and 0002. Landholding is stored with its unit; legal landholding definitions differ by scheme, so no derived value is stored.

create table public.citizen_agricultural_profiles (
  citizen_id uuid primary key references public.citizen_profiles(id) on delete cascade,
  occupation_types text[] not null default '{}' check (occupation_types <@ array['landowner','tenant','sharecropper','cultivator','agricultural_labourer','other']::text[]),
  landholding_area numeric check (landholding_area is null or landholding_area >= 0),
  landholding_unit text check (landholding_unit is null or landholding_unit in ('acre','bigha','katha','decimal','hectare')),
  land_state text check (char_length(land_state) <= 100),
  land_district text check (char_length(land_district) <= 100),
  crops text check (crops is null or char_length(crops) <= 300),
  irrigation text check (irrigation is null or irrigation in ('available','not_available','partial','unsure')),
  cultivation_pattern text check (cultivation_pattern is null or cultivation_pattern in ('seasonal','year_round','not_cultivating')),
  constraint landholding_unit_required check (landholding_area is null or landholding_unit is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger citizen_agricultural_profiles_set_updated_at
  before update on public.citizen_agricultural_profiles
  for each row execute function public.set_updated_at();

alter table public.citizen_agricultural_profiles enable row level security;

create policy "owner can select agricultural profile"
  on public.citizen_agricultural_profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert agricultural profile"
  on public.citizen_agricultural_profiles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update agricultural profile"
  on public.citizen_agricultural_profiles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete agricultural profile"
  on public.citizen_agricultural_profiles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- Land records and farmer registration status are recorded as document inventory entries in 0003, not here.
