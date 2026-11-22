-- 0011: matching engine, scheme documents, application steps, assessments, claims, tasks, and reminders.
-- Depends on 0001, 0002, 0003, 0004, 0009, 0010.
-- Never store Aadhaar or identity-document numbers.

-- ---------------------------------------------------------------------------
-- 1. Extend schemes and scheme_versions with catalog metadata
-- ---------------------------------------------------------------------------
alter table public.schemes
  add column if not exists name_bn text,
  add column if not exists ministry_label text,
  add column if not exists jurisdiction text default 'state' check (jurisdiction in ('central', 'state')),
  add column if not exists state text default 'West Bengal',
  add column if not exists category text default 'general' check (category in ('education','agriculture','women','social_welfare','employment','health','general')),
  add column if not exists portal_url text check (portal_url is null or portal_url ~ '^https?://'),
  add column if not exists short_description text,
  add column if not exists description_en text,
  add column if not exists description_bn text;

alter table public.scheme_versions
  add column if not exists summary_en text,
  add column if not exists summary_bn text,
  add column if not exists benefit_summary_en text,
  add column if not exists benefit_summary_bn text,
  add column if not exists application_deadline text;

-- ---------------------------------------------------------------------------
-- 2. scheme_documents: document types required for a scheme version
-- ---------------------------------------------------------------------------
create table if not exists public.scheme_documents (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  is_mandatory boolean not null default true,
  notes_en text,
  notes_bn text,
  created_at timestamptz not null default now(),
  unique (scheme_version_id, document_type_id)
);

-- ---------------------------------------------------------------------------
-- 3. scheme_application_steps: official steps to apply for a scheme
-- ---------------------------------------------------------------------------
create table if not exists public.scheme_application_steps (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  step_order integer not null check (step_order >= 1),
  title_en text not null check (char_length(title_en) between 1 and 200),
  title_bn text,
  body_en text not null,
  body_bn text,
  source_id uuid references public.scheme_sources(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (scheme_version_id, step_order)
);

-- ---------------------------------------------------------------------------
-- 4. eligibility_assessments: evaluated outcome per citizen and scheme version
-- ---------------------------------------------------------------------------
create table if not exists public.eligibility_assessments (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  outcome text not null check (outcome in ('likely_eligible','needs_more_info','likely_ineligible','cannot_assess')),
  profile_snapshot_hash text not null,
  rules_engine_version text not null default '1.0.0',
  evaluated_at timestamptz not null default now(),
  unique (citizen_id, scheme_version_id)
);

-- ---------------------------------------------------------------------------
-- 5. eligibility_rule_results: granular leaf-level trace for explanations
-- ---------------------------------------------------------------------------
create table if not exists public.eligibility_rule_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.eligibility_assessments(id) on delete cascade,
  rule_id uuid references public.scheme_rules(id) on delete cascade,
  rule_path text not null,
  result text not null check (result in ('PASS','FAIL','UNKNOWN')),
  missing_fields text[] not null default '{}',
  source_id uuid references public.scheme_sources(id) on delete set null,
  clause_reference text,
  explanation text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. claims: user-tracked application record (PRAPTI does not submit)
-- ---------------------------------------------------------------------------
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','preparing_documents','ready_to_apply','submitted','under_verification','approved','rejected','withdrawn')),
  reference_note text check (char_length(reference_note) <= 500),
  submitted_on_user_report date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (citizen_id, scheme_id)
);

create trigger claims_set_updated_at
  before update on public.claims
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. claim_tasks: checklists for a claim
-- ---------------------------------------------------------------------------
create table if not exists public.claim_tasks (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  step_order integer not null default 1,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  is_done boolean not null default false,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger claim_tasks_set_updated_at
  before update on public.claim_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. claim_status_events: append-only status transition history
-- ---------------------------------------------------------------------------
create table if not exists public.claim_status_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  from_status text check (from_status is null or from_status in ('not_started','preparing_documents','ready_to_apply','submitted','under_verification','approved','rejected','withdrawn')),
  to_status text not null check (to_status in ('not_started','preparing_documents','ready_to_apply','submitted','under_verification','approved','rejected','withdrawn')),
  actor_user_id uuid not null references public.user_profiles(id) on delete cascade,
  note text check (char_length(note) <= 1000),
  occurred_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9. saved_schemes: bookmarked schemes
-- ---------------------------------------------------------------------------
create table if not exists public.saved_schemes (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  scheme_id uuid not null references public.schemes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (citizen_id, scheme_id)
);

-- ---------------------------------------------------------------------------
-- 10. reminders: deadline and pending task reminders
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  kind text not null default 'task' check (kind in ('deadline','follow_up','renewal','task')),
  due_at timestamptz not null,
  channel text not null default 'in_app' check (channel in ('in_app','email')),
  delivered_at timestamptz,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. Row Level Security on all new tables
-- ---------------------------------------------------------------------------
alter table public.scheme_documents enable row level security;
alter table public.scheme_application_steps enable row level security;
alter table public.eligibility_assessments enable row level security;
alter table public.eligibility_rule_results enable row level security;
alter table public.claims enable row level security;
alter table public.claim_tasks enable row level security;
alter table public.claim_status_events enable row level security;
alter table public.saved_schemes enable row level security;
alter table public.reminders enable row level security;

-- scheme_documents policies
create policy "anyone can view published scheme documents"
  on public.scheme_documents for select to authenticated
  using (
    public.is_administrator()
    or exists (
      select 1 from public.scheme_versions v
      where v.id = scheme_documents.scheme_version_id and v.status = 'published'
    )
  );

create policy "admin can manage scheme documents"
  on public.scheme_documents for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- scheme_application_steps policies
create policy "anyone can view published scheme steps"
  on public.scheme_application_steps for select to authenticated
  using (
    public.is_administrator()
    or exists (
      select 1 from public.scheme_versions v
      where v.id = scheme_application_steps.scheme_version_id and v.status = 'published'
    )
  );

create policy "admin can manage scheme steps"
  on public.scheme_application_steps for all to authenticated
  using (public.is_administrator())
  with check (public.is_administrator());

-- eligibility_assessments policies (owner of citizen profile)
create policy "owner can select eligibility assessments"
  on public.eligibility_assessments for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = eligibility_assessments.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert eligibility assessments"
  on public.eligibility_assessments for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = eligibility_assessments.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update eligibility assessments"
  on public.eligibility_assessments for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = eligibility_assessments.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete eligibility assessments"
  on public.eligibility_assessments for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = eligibility_assessments.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- eligibility_rule_results policies
create policy "owner can select eligibility rule results"
  on public.eligibility_rule_results for select to authenticated
  using (
    exists (
      select 1 from public.eligibility_assessments ea
      join public.citizen_profiles cp on cp.id = ea.citizen_id
      where ea.id = eligibility_rule_results.assessment_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert eligibility rule results"
  on public.eligibility_rule_results for insert to authenticated
  with check (
    exists (
      select 1 from public.eligibility_assessments ea
      join public.citizen_profiles cp on cp.id = ea.citizen_id
      where ea.id = eligibility_rule_results.assessment_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete eligibility rule results"
  on public.eligibility_rule_results for delete to authenticated
  using (
    exists (
      select 1 from public.eligibility_assessments ea
      join public.citizen_profiles cp on cp.id = ea.citizen_id
      where ea.id = eligibility_rule_results.assessment_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- claims policies
create policy "owner can select claims"
  on public.claims for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = claims.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert claims"
  on public.claims for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = claims.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update claims"
  on public.claims for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = claims.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete claims"
  on public.claims for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = claims.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- claim_tasks policies
create policy "owner can select claim tasks"
  on public.claim_tasks for select to authenticated
  using (
    exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_tasks.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert claim tasks"
  on public.claim_tasks for insert to authenticated
  with check (
    exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_tasks.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update claim tasks"
  on public.claim_tasks for update to authenticated
  using (
    exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_tasks.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete claim tasks"
  on public.claim_tasks for delete to authenticated
  using (
    exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_tasks.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- claim_status_events policies
create policy "owner can select claim status events"
  on public.claim_status_events for select to authenticated
  using (
    exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_status_events.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert claim status events"
  on public.claim_status_events for insert to authenticated
  with check (
    actor_user_id = (select auth.uid())
    and exists (
      select 1 from public.claims c
      join public.citizen_profiles cp on cp.id = c.citizen_id
      where c.id = claim_status_events.claim_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- saved_schemes policies
create policy "owner can select saved schemes"
  on public.saved_schemes for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = saved_schemes.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert saved schemes"
  on public.saved_schemes for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = saved_schemes.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete saved schemes"
  on public.saved_schemes for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = saved_schemes.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

-- reminders policies
create policy "owner can select reminders"
  on public.reminders for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = reminders.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert reminders"
  on public.reminders for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = reminders.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update reminders"
  on public.reminders for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = reminders.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete reminders"
  on public.reminders for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = reminders.citizen_id and cp.owner_user_id = (select auth.uid())
    )
  );

