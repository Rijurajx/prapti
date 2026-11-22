-- 0009: scheme registry, versions, sources, review events, audit log, and the administrator role. Depends on 0001. Admin access never grants read access to citizen_*, household_* or claims tables. Never store Aadhaar or identity-document numbers.

-- 1. Administrators. Purpose: marks which users hold the administrator role. Rows are inserted out of band only (SQL editor by the operator); no API writes to this table.
create table public.administrators (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  granted_at timestamptz not null default now()
);

-- 2. Administrator check. Purpose: single source of truth for admin-gated policies; security definer so policies do not recurse through administrators RLS.
create or replace function public.is_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.administrators a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_administrator() from public, anon;
grant execute on function public.is_administrator() to authenticated;

-- 3. Schemes. Purpose: one row per government scheme; current_version_id points at the version citizens see.
create table public.schemes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$'),
  name text not null check (char_length(name) between 1 and 200),
  status text not null default 'draft' check (status in ('draft','in_review','published','retired')),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger schemes_set_updated_at
  before update on public.schemes
  for each row execute function public.set_updated_at();

-- 4. Scheme versions. Purpose: an immutable-once-published revision of a scheme's rules and sources.
create table public.scheme_versions (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  status text not null default 'draft' check (status in ('draft','in_review','published','retired')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (scheme_id, version_number)
);

alter table public.schemes
  add constraint schemes_current_version_fk
  foreign key (current_version_id) references public.scheme_versions(id);

-- 5. Scheme sources. Purpose: the official documents a version's rules are traced back to; verification is recorded with who and when.
create table public.scheme_sources (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  source_type text not null check (source_type in ('official_document','official_website','gazette','other')),
  title text not null check (char_length(title) between 1 and 300),
  url text check (url is null or url ~ '^https://'),
  published_on date,
  verified_by_user_id uuid references public.user_profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint scheme_sources_verified_consistent check (verified_at is null or verified_by_user_id is not null)
);

-- 6. Scheme rules. Purpose: machine-readable eligibility and exclusion rules; every rule must cite a source and a clause.
create table public.scheme_rules (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  rule_kind text not null check (rule_kind in ('eligibility','exclusion')),
  rule_json jsonb not null check (jsonb_typeof(rule_json) = 'object'),
  source_id uuid not null references public.scheme_sources(id) on delete restrict,
  clause_reference text not null check (char_length(clause_reference) between 1 and 200),
  created_at timestamptz not null default now()
);

-- 7. Scheme review events. Purpose: append-only log of reviewer decisions on a scheme version.
create table public.scheme_review_events (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  reviewer_user_id uuid not null references public.user_profiles(id),
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  comment text check (char_length(comment) <= 2000),
  at timestamptz not null default now()
);

-- 8. Admin audit logs. Purpose: append-only record of administrator actions; no request bodies or identity data.
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.user_profiles(id),
  action text not null check (char_length(action) between 1 and 80),
  target_table text not null,
  target_id uuid,
  request_id text,
  at timestamptz not null default now()
);

-- 9. Row level security: enabled on every table; no grants to anon.
alter table public.administrators enable row level security;
alter table public.schemes enable row level security;
alter table public.scheme_versions enable row level security;
alter table public.scheme_sources enable row level security;
alter table public.scheme_rules enable row level security;
alter table public.scheme_review_events enable row level security;
alter table public.admin_audit_logs enable row level security;

-- administrators: a user sees only their own row; no write policies, so only out-of-band inserts succeed
create policy "user can select own administrator row"
  on public.administrators
  for select to authenticated
  using (user_id = (select auth.uid()));

-- schemes: published rows are public to signed-in users; administrators manage everything
create policy "published or admin can select schemes"
  on public.schemes
  for select to authenticated
  using (status = 'published' or public.is_administrator());

create policy "admin can insert schemes"
  on public.schemes
  for insert to authenticated
  with check (public.is_administrator());

create policy "admin can update schemes"
  on public.schemes
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy "admin can delete schemes"
  on public.schemes
  for delete to authenticated
  using (public.is_administrator());

-- scheme_versions: same rule as schemes
create policy "published or admin can select scheme versions"
  on public.scheme_versions
  for select to authenticated
  using (status = 'published' or public.is_administrator());

create policy "admin can insert scheme versions"
  on public.scheme_versions
  for insert to authenticated
  with check (public.is_administrator());

create policy "admin can update scheme versions"
  on public.scheme_versions
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy "admin can delete scheme versions"
  on public.scheme_versions
  for delete to authenticated
  using (public.is_administrator());

-- scheme_sources: readable when the parent version is published; administrators manage everything
create policy "admin or published parent can select scheme sources"
  on public.scheme_sources
  for select to authenticated
  using (
    public.is_administrator()
    or exists (
      select 1 from public.scheme_versions v
      where v.id = scheme_sources.scheme_version_id
        and v.status = 'published'
    )
  );

create policy "admin can insert scheme sources"
  on public.scheme_sources
  for insert to authenticated
  with check (public.is_administrator());

create policy "admin can update scheme sources"
  on public.scheme_sources
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy "admin can delete scheme sources"
  on public.scheme_sources
  for delete to authenticated
  using (public.is_administrator());

-- scheme_rules: same rule as scheme_sources
create policy "admin or published parent can select scheme rules"
  on public.scheme_rules
  for select to authenticated
  using (
    public.is_administrator()
    or exists (
      select 1 from public.scheme_versions v
      where v.id = scheme_rules.scheme_version_id
        and v.status = 'published'
    )
  );

create policy "admin can insert scheme rules"
  on public.scheme_rules
  for insert to authenticated
  with check (public.is_administrator());

create policy "admin can update scheme rules"
  on public.scheme_rules
  for update to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

create policy "admin can delete scheme rules"
  on public.scheme_rules
  for delete to authenticated
  using (public.is_administrator());

-- scheme_review_events: append-only, administrators only
create policy "admin can select scheme review events"
  on public.scheme_review_events
  for select to authenticated
  using (public.is_administrator());

create policy "admin can insert scheme review events"
  on public.scheme_review_events
  for insert to authenticated
  with check (public.is_administrator());

-- admin_audit_logs: append-only, administrators only
create policy "admin can select admin audit logs"
  on public.admin_audit_logs
  for select to authenticated
  using (public.is_administrator());

create policy "admin can insert admin audit logs"
  on public.admin_audit_logs
  for insert to authenticated
  with check (public.is_administrator());

-- 10. Immutability. Purpose: once a scheme version is published, its rules and sources cannot change or disappear; only a published version may move to retired.
create or replace function public.block_published_version_edits()
returns trigger
language plpgsql
as $$
declare
  v_status text;
begin
  if tg_table_name = 'scheme_versions' then
    if tg_op = 'UPDATE' and old.status = 'published' and (
         new.status is distinct from 'retired'
         or new.version_number <> old.version_number
         or new.scheme_id <> old.scheme_id
         or new.published_at is distinct from old.published_at
       ) then
      raise exception 'published scheme versions are immutable' using errcode = 'check_violation';
    end if;
    return new;
  end if;

  -- scheme_rules and scheme_sources: block changes to rows of a published version, on both the old and the new parent
  if tg_op in ('UPDATE', 'DELETE') then
    select v.status into v_status from public.scheme_versions v where v.id = old.scheme_version_id;
    if v_status = 'published' then
      raise exception 'published scheme versions are immutable' using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    select v.status into v_status from public.scheme_versions v where v.id = new.scheme_version_id;
    if v_status = 'published' then
      raise exception 'published scheme versions are immutable' using errcode = 'check_violation';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger scheme_rules_block_published_edits
  before update or delete on public.scheme_rules
  for each row execute function public.block_published_version_edits();

create trigger scheme_sources_block_published_edits
  before update or delete on public.scheme_sources
  for each row execute function public.block_published_version_edits();

create trigger scheme_versions_block_published_edits
  before update on public.scheme_versions
  for each row execute function public.block_published_version_edits();
