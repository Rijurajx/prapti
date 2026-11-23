-- 0016: Citizen Asset Profiles
-- Tracks owned motorized vehicles (2-wheeler, 4-wheeler), housing (pucca/kutcha/count),
-- landholdings, agricultural machinery, and SECC welfare exclusion/inclusion indicators.
-- Never stores sensitive document numbers or asset registration certificate copies.

create table if not exists public.citizen_asset_profiles (
  citizen_id uuid primary key references public.citizen_profiles(id) on delete cascade,
  -- Motorized vehicles
  owns_two_wheeler boolean not null default false,
  two_wheeler_count integer check (two_wheeler_count is null or two_wheeler_count >= 0),
  owns_four_wheeler boolean not null default false,
  four_wheeler_count integer check (four_wheeler_count is null or four_wheeler_count >= 0),
  -- Housing & Residential property
  owns_house boolean not null default false,
  house_count integer check (house_count is null or house_count >= 0),
  house_type text check (house_type is null or house_type in ('pucca', 'semi_pucca', 'kutcha', 'homeless')),
  -- Landholdings
  owns_land boolean not null default false,
  land_area_acres numeric check (land_area_acres is null or land_area_acres >= 0),
  land_type text check (land_type is null or land_type in ('agricultural', 'residential', 'commercial', 'mixed')),
  -- Agricultural Machinery & SECC Welfare Indicators
  owns_agricultural_equipment boolean not null default false,
  agricultural_equipment_details text check (agricultural_equipment_details is null or char_length(agricultural_equipment_details) <= 250),
  has_refrigerator boolean not null default false,
  has_air_conditioner boolean not null default false,
  owns_commercial_property boolean not null default false,
  has_kisan_credit_card boolean not null default false,
  kcc_credit_limit_inr bigint check (kcc_credit_limit_inr is null or kcc_credit_limit_inr >= 0),
  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger for updated_at
create trigger citizen_asset_profiles_set_updated_at
  before update on public.citizen_asset_profiles
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.citizen_asset_profiles enable row level security;

create policy "owner can select asset profile"
  on public.citizen_asset_profiles for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_asset_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert asset profile"
  on public.citizen_asset_profiles for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_asset_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update asset profile"
  on public.citizen_asset_profiles for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_asset_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_asset_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete asset profile"
  on public.citizen_asset_profiles for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_asset_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );
