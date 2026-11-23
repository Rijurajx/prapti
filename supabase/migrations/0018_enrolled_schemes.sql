-- 0018: Citizen Enrolled / Active Schemes (Schemes they are already receiving)
-- Allows citizens to record which central or state schemes they are actively enrolled in
-- and currently receiving benefits from.

create table if not exists public.citizen_enrolled_schemes (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (citizen_id, scheme_id)
);

alter table public.citizen_enrolled_schemes enable row level security;

create policy "Users can view enrolled schemes for owned citizens"
  on public.citizen_enrolled_schemes for select
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_enrolled_schemes.citizen_id
        and cp.owner_user_id = auth.uid()
    )
  );

create policy "Users can insert enrolled schemes for owned citizens"
  on public.citizen_enrolled_schemes for insert
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_enrolled_schemes.citizen_id
        and cp.owner_user_id = auth.uid()
    )
  );

create policy "Users can delete enrolled schemes for owned citizens"
  on public.citizen_enrolled_schemes for delete
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_enrolled_schemes.citizen_id
        and cp.owner_user_id = auth.uid()
    )
  );
