-- 0003: finance, employment, education and document inventory. Depends on 0001 and 0002. Stores availability only, never identity-document numbers or copies.

-- ---------------------------------------------------------------------------
-- 1. citizen_financial_profiles
-- ---------------------------------------------------------------------------
create table public.citizen_financial_profiles (
  citizen_id uuid primary key references public.citizen_profiles(id) on delete cascade,
  annual_income_inr bigint check (annual_income_inr is null or annual_income_inr >= 0),
  family_annual_income_inr bigint check (family_annual_income_inr is null or family_annual_income_inr >= 0),
  income_range text check (income_range is null or income_range in ('below_1_lakh','1_to_3_lakh','3_to_5_lakh','5_to_8_lakh','above_8_lakh')),
  income_unknown boolean not null default false,
  financial_year text check (financial_year is null or financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  income_source text check (income_source is null or income_source in ('salary','self_employment','agriculture','daily_wage','pension','family_support','other','none')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger citizen_financial_profiles_set_updated_at
  before update on public.citizen_financial_profiles
  for each row execute function public.set_updated_at();

alter table public.citizen_financial_profiles enable row level security;

create policy "owner can select finance"
  on public.citizen_financial_profiles for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_financial_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert finance"
  on public.citizen_financial_profiles for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_financial_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update finance"
  on public.citizen_financial_profiles for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_financial_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_financial_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete finance"
  on public.citizen_financial_profiles for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_financial_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 2. citizen_employment_profiles
-- ---------------------------------------------------------------------------
create table public.citizen_employment_profiles (
  citizen_id uuid primary key references public.citizen_profiles(id) on delete cascade,
  statuses text[] not null default '{}' check (statuses <@ array['employed','unemployed','self_employed','student','retired','homemaker','agricultural_worker','daily_wage_worker','other']::text[]),
  sector text check (sector is null or char_length(sector) <= 100),
  employment_registered boolean,
  unemployment_months integer check (unemployment_months is null or unemployment_months between 0 and 600),
  skills text check (skills is null or char_length(skills) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger citizen_employment_profiles_set_updated_at
  before update on public.citizen_employment_profiles
  for each row execute function public.set_updated_at();

alter table public.citizen_employment_profiles enable row level security;

create policy "owner can select employment"
  on public.citizen_employment_profiles for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_employment_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert employment"
  on public.citizen_employment_profiles for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_employment_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update employment"
  on public.citizen_employment_profiles for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_employment_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_employment_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete employment"
  on public.citizen_employment_profiles for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_employment_profiles.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. education_records
-- ---------------------------------------------------------------------------
create table public.education_records (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  level text not null check (level in ('class_10','class_12','diploma','undergraduate','postgraduate','doctoral','other')),
  board_or_university text check (board_or_university is null or char_length(board_or_university) <= 150),
  institution text check (institution is null or char_length(institution) <= 200),
  stream text check (stream is null or stream in ('science','commerce','arts_humanities','vocational','other')),
  programme text check (programme is null or char_length(programme) <= 150),
  passing_year integer check (passing_year is null or passing_year between 1950 and 2100),
  is_currently_pursuing boolean not null default false,
  current_year_or_semester text check (current_year_or_semester is null or char_length(current_year_or_semester) <= 40),
  marking_scale text check (marking_scale is null or marking_scale in ('percentage','cgpa','grade','marks')),
  obtained_marks numeric check (obtained_marks is null or obtained_marks >= 0),
  maximum_marks numeric check (maximum_marks is null or maximum_marks > 0),
  percentage numeric check (percentage is null or percentage between 0 and 100),
  cgpa numeric check (cgpa is null or cgpa between 0 and 10),
  marksheet_available text check (marksheet_available is null or marksheet_available in ('available','not_available','applied_for','unsure','not_applicable')),
  pass_certificate_available text check (pass_certificate_available is null or pass_certificate_available in ('available','not_available','applied_for','unsure','not_applicable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index education_records_citizen_id_idx on public.education_records(citizen_id);

create trigger education_records_set_updated_at
  before update on public.education_records
  for each row execute function public.set_updated_at();

alter table public.education_records enable row level security;

create policy "owner can select education"
  on public.education_records for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = education_records.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert education"
  on public.education_records for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = education_records.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update education"
  on public.education_records for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = education_records.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = education_records.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete education"
  on public.education_records for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = education_records.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. education_semester_results
-- ---------------------------------------------------------------------------
create table public.education_semester_results (
  id uuid primary key default gen_random_uuid(),
  education_record_id uuid not null references public.education_records(id) on delete cascade,
  semester_number integer not null check (semester_number between 1 and 20),
  sgpa numeric check (sgpa is null or sgpa between 0 and 10),
  created_at timestamptz not null default now(),
  unique (education_record_id, semester_number)
);

alter table public.education_semester_results enable row level security;

create policy "owner can select education semesters"
  on public.education_semester_results for select to authenticated
  using (
    exists (
      select 1 from public.education_records er
      join public.citizen_profiles cp on cp.id = er.citizen_id
      where er.id = education_semester_results.education_record_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert education semesters"
  on public.education_semester_results for insert to authenticated
  with check (
    exists (
      select 1 from public.education_records er
      join public.citizen_profiles cp on cp.id = er.citizen_id
      where er.id = education_semester_results.education_record_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update education semesters"
  on public.education_semester_results for update to authenticated
  using (
    exists (
      select 1 from public.education_records er
      join public.citizen_profiles cp on cp.id = er.citizen_id
      where er.id = education_semester_results.education_record_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.education_records er
      join public.citizen_profiles cp on cp.id = er.citizen_id
      where er.id = education_semester_results.education_record_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete education semesters"
  on public.education_semester_results for delete to authenticated
  using (
    exists (
      select 1 from public.education_records er
      join public.citizen_profiles cp on cp.id = er.citizen_id
      where er.id = education_semester_results.education_record_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 5. document_types (reference data; maintainer-managed)
-- ---------------------------------------------------------------------------
create table public.document_types (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  category text not null check (category in ('identity','general','education','employment','agriculture','disability','social','family','financial')),
  is_sensitive boolean not null default false,
  description text
);

alter table public.document_types enable row level security;

create policy "authenticated can read document types"
  on public.document_types for select to authenticated
  using (true);

insert into public.document_types (code, name, category, is_sensitive, description) values
  ('aadhaar_card','Aadhaar card','identity',true,'Availability only. The number is never collected.'),
  ('voter_id_card','Voter ID card','identity',true,'Availability only.'),
  ('pan_card','PAN card','identity',true,'Availability only.'),
  ('ration_card','Ration card','identity',false,null),
  ('passport','Passport','identity',true,'Availability only.'),
  ('driving_licence','Driving licence','identity',true,'Availability only.'),
  ('birth_certificate','Birth certificate','general',false,null),
  ('residence_certificate','Residence certificate','general',false,null),
  ('domicile_certificate','Domicile certificate','general',false,null),
  ('income_certificate','Income certificate','financial',false,null),
  ('caste_certificate','Caste certificate','social',false,'Only where a scheme requires it.'),
  ('disability_certificate','Disability certificate','disability',false,'Only where a scheme requires it.'),
  ('marriage_certificate','Marriage certificate','family',false,null),
  ('death_certificate','Death certificate','family',false,null),
  ('widowhood_certificate','Widowhood-related certificate','family',false,'Only where a scheme requires it.'),
  ('bank_passbook','Bank account passbook','financial',false,null),
  ('passport_photo','Passport-sized photograph','general',false,null),
  ('class_10_marksheet','Class 10 marksheet','education',false,null),
  ('class_10_pass_certificate','Class 10 pass certificate','education',false,null),
  ('class_12_marksheet','Class 12 marksheet','education',false,null),
  ('class_12_pass_certificate','Class 12 pass certificate','education',false,null),
  ('diploma_certificate','Diploma certificate','education',false,null),
  ('degree_certificate','Degree certificate','education',false,null),
  ('admission_proof','Current admission proof','education',false,null),
  ('fee_receipt','Fee receipt','education',false,null),
  ('bonafide_certificate','Bonafide student certificate','education',false,null),
  ('transfer_certificate','Transfer certificate','education',false,null),
  ('land_record','Land ownership record / record of rights','agriculture',false,null),
  ('cultivation_certificate','Cultivation certificate','agriculture',false,null),
  ('farmer_registration','Farmer registration document','agriculture',false,null),
  ('crop_insurance_enrolment','Crop insurance enrolment evidence','agriculture',false,null),
  ('skill_certificate','Skill or trade certificate','employment',false,null),
  ('employment_registration','Employment registration','employment',false,null),
  ('worker_registration','Worker registration','employment',false,null)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 6. citizen_document_inventory (availability status only)
-- ---------------------------------------------------------------------------
create table public.citizen_document_inventory (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.citizen_profiles(id) on delete cascade,
  document_code text not null references public.document_types(code),
  status text not null check (status in ('available','not_available','applied_for','expired','unsure','not_applicable')),
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (citizen_id, document_code)
);

create trigger citizen_document_inventory_set_updated_at
  before update on public.citizen_document_inventory
  for each row execute function public.set_updated_at();

alter table public.citizen_document_inventory enable row level security;

create policy "owner can select documents"
  on public.citizen_document_inventory for select to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_document_inventory.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can insert documents"
  on public.citizen_document_inventory for insert to authenticated
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_document_inventory.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can update documents"
  on public.citizen_document_inventory for update to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_document_inventory.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_document_inventory.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );

create policy "owner can delete documents"
  on public.citizen_document_inventory for delete to authenticated
  using (
    exists (
      select 1 from public.citizen_profiles cp
      where cp.id = citizen_document_inventory.citizen_id
        and cp.owner_user_id = (select auth.uid())
    )
  );
