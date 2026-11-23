-- 0014: Category tags and expanded scheme registry (Central + State + Scholarships + Pensions)
-- Sets up tags on citizen_profiles and schemes, and seeds 17 verified official schemes.
-- Uses document_code text references public.document_types(code). Never stores identity document numbers.

-- 1. Ensure scheme_documents table exists with document_code
create table if not exists public.scheme_documents (
  id uuid primary key default gen_random_uuid(),
  scheme_version_id uuid not null references public.scheme_versions(id) on delete cascade,
  document_code text not null references public.document_types(code) on delete restrict,
  is_mandatory boolean not null default true,
  notes_en text,
  notes_bn text,
  created_at timestamptz not null default now(),
  unique (scheme_version_id, document_code)
);

alter table public.scheme_documents enable row level security;

drop policy if exists "anyone can view published scheme documents" on public.scheme_documents;
create policy "anyone can view published scheme documents"
  on public.scheme_documents for select to authenticated
  using (
    exists (
      select 1 from public.scheme_versions sv
      join public.schemes s on s.id = sv.scheme_id
      where sv.id = scheme_documents.scheme_version_id
        and sv.status = 'published'
        and s.status = 'published'
    )
  );

-- 2. Add category_tags to citizen_profiles and tags to schemes
alter table public.citizen_profiles
  add column if not exists category_tags text[] not null default '{}';

alter table public.schemes
  add column if not exists tags text[] not null default '{}';

-- 3. Procedure to seed all 17 verified government schemes
do $$
declare
  s_id uuid;
  v_id uuid;
  src_id uuid;
begin

  -- =========================================================================
  -- 1. Kanyashree Prakalpa (K2) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'kanyashree-k2',
    'Kanyashree Prakalpa (Annual Grant K2)',
    'কন্যাশ্রী প্রকল্প (কে-২ এককালীন অনুদান)',
    'Department of Women & Child Development and Social Welfare, Government of West Bengal',
    'state', 'West Bengal', 'women',
    'https://wbkanyashree.gov.in',
    'One-time financial grant of ₹25,000 for unmarried female students aged 18 to 19 pursuing higher education in West Bengal.',
    array['student', 'teenage', 'girl', 'women', 'scholarship', 'education'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Official rules for Kanyashree Prakalpa K-2: one-time transfer of ₹25,000 on reaching 18 years while pursuing education.',
    '১৮ বছর বয়সে অবিবাহিত নারী শিক্ষার্থীদের উচ্চশিক্ষায় উৎসাহিত করতে এককালীন ২৫,০০০ টাকার আর্থিক অনুদান।',
    '₹25,000 one-time direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'West Bengal Kanyashree Prakalpa Official Portal', 'https://wbkanyashree.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Clause 3.1 Eligibility Criteria (State, Gender, Age, Marital Status)', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'marital_status', 'op', 'eq', 'value', 'never_married'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 19)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Municipal or panchayat birth certificate'),
    (v_id, 'bank_passbook', true, 'Savings bank account in applicant single name'),
    (v_id, 'bonafide_certificate', true, 'Proof of current enrollment in school or college'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability for biometric authentication')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Obtain Form K2 from Institution', 'প্রতিষ্ঠান থেকে কে-২ ফর্ম সংগ্রহ', 'Collect the physical K2 application form from the Head of Institution (HOI) of your school or college.', src_id),
    (v_id, 2, 'Attach Required Documents', 'প্রয়োজনীয় নথি সংযুক্তকরণ', 'Enclose copies of birth certificate, unmarried declaration, and single-holder bank passbook.', src_id),
    (v_id, 3, 'Institutional Verification & Portal Upload', 'প্রাতিষ্ঠানিক যাচাই ও পোর্টাল আপলোড', 'Submit the completed form to the institution. The school or college uploads the data to wbkanyashree.gov.in.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 2. Swami Vivekananda Merit-cum-Means Scholarship (SVMCM) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'svmcm-scholarship',
    'Swami Vivekananda Merit-cum-Means Scholarship (SVMCM)',
    'স্বামী বিবেকানন্দ মেরিট-কাম-মিনস স্কলারশিপ',
    'Higher Education Department, Government of West Bengal',
    'state', 'West Bengal', 'education',
    'https://svmcm.wbhed.gov.in',
    'State scholarship for meritorious students in West Bengal pursuing Higher Secondary, Undergraduate, and Postgraduate studies with annual family income up to ₹2,50,000.',
    array['student', 'scholarship', 'education', 'merit', 'general', 'sc', 'st', 'obc'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Financial scholarship assistance ranging from ₹1,000 to ₹5,000 per month depending on degree course level.',
    'উচ্চমাধ্যমিক, স্নাতক ও স্নাতকোত্তর স্তরের মেধাবী শিক্ষার্থীদের জন্য মাসিক ১,০০০ থেকে ৫,০০০ টাকা পর্যন্ত বৃত্তি।',
    '₹1,000 to ₹5,000 monthly stipend'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'WB SVMCM Guidelines', 'https://svmcm.wbhed.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Clause 2.1 Residence, Academic Minimum & Family Income Ceiling', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000),
        jsonb_build_object('field', 'has_passed_class_10', 'op', 'is_true')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'class_10_marksheet', true, 'Marksheet of Madhyamik Pariksha or equivalent'),
    (v_id, 'income_certificate', true, 'Income certificate issued by Jt. BDO / BDO / SDO / Executive Officer'),
    (v_id, 'domicile_certificate', true, 'Domicile certificate or Aadhaar card with West Bengal address'),
    (v_id, 'bank_passbook', true, 'Bank passbook front page showing IFSC and account number'),
    (v_id, 'admission_proof', true, 'Admission receipt for the ongoing course'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Online Registration on SVMCM Portal', 'এসভিএমসিএম পোর্টালে অনলাইন নিবন্ধন', 'Visit svmcm.wbhed.gov.in and click New Registration. Select your directorate based on course level.', src_id),
    (v_id, 2, 'Fill Academic & Bank Details', 'শিক্ষাগত ও ব্যাঙ্ক বিবরণ পূরণ', 'Input percentage scored in previous qualifying examination and active bank account details.', src_id),
    (v_id, 3, 'Upload Scanned Documents', 'স্ক্যান করা নথি আপলোড', 'Upload scanned marksheet, income certificate, admission receipt, and bank passbook.', src_id),
    (v_id, 4, 'Submit & Forward to Institution', 'জমা ও প্রতিষ্ঠানে প্রেরণ', 'Submit the online application. The Head of Institution verifies and forwards it to the Directorate for disbursement.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 3. OASIS Scholarship for SC / ST / OBC Students - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'oasis-scholarship',
    'OASIS Post-Matric Scholarship for SC, ST & OBC Students',
    'ওয়েসিস স্কলারশিপ (এসসি, এসটি ও ওবিসি শিক্ষার্থীদের জন্য)',
    'Backward Classes Welfare Department & Tribal Development Department, Government of West Bengal',
    'state', 'West Bengal', 'education',
    'https://oasis.gov.in',
    'Financial scholarship assistance for Scheduled Caste, Scheduled Tribe, and Other Backward Class students of West Bengal studying in post-matriculation or post-secondary stages.',
    array['student', 'scholarship', 'sc', 'st', 'obc', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Maintenance allowance and compulsory non-refundable fees reimbursed directly to student bank accounts.',
    'এসসি/এসটি/ওবিসি শিক্ষার্থীদের পোস্ট-ম্যাট্রিক স্তরে পড়াশোনার জন্য বার্ষিক রক্ষণাবেক্ষণ ভাতা ও টিউশন ফি সহায়তা।',
    '₹3,000 to ₹12,000 annual maintenance allowance & course fee refund'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'OASIS Portal Guidelines', 'https://oasis.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Clause 1.2 Domicile, Caste Category & Income Ceiling', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'caste_certificate', true, 'Official SC/ST/OBC certificate issued by SDO or BDO'),
    (v_id, 'income_certificate', true, 'Income certificate from competent authority (<= ₹2,50,000 p.a.)'),
    (v_id, 'bonafide_certificate', true, 'Institutional verification certificate from school/college'),
    (v_id, 'bank_passbook', true, 'Single bank account linked to Aadhaar for DBT'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Register on OASIS Portal', 'ওয়েসিস পোর্টালে নিবন্ধন', 'Visit oasis.gov.in, select your district and caste category (SC/ST/OBC) to generate your user ID and password.', src_id),
    (v_id, 2, 'Fill Scholarship Details', 'বৃত্তির আবেদনপত্র পূরণ', 'Log in with generated credentials and fill your basic, academic, and bank account details.', src_id),
    (v_id, 3, 'Submit Printed Copy to Institution', 'প্রতিষ্ঠানে প্রিন্ট কপি জমা', 'Print the completed application acknowledgment and submit with document photocopies to your educational institution.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 4. Aikyashree - Minority Scholarship Scheme - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'aikyashree-scholarship',
    'Aikyashree - State Minority Scholarship Scheme',
    'ঐক্যশ্রী - রাজ্য সংখ্যালঘু স্কলারশিপ প্রকল্প',
    'Minority Affairs & Madrasah Education Department, Government of West Bengal',
    'state', 'West Bengal', 'education',
    'https://wbmdfcscholarship.in',
    'Pre-Matric, Post-Matric, and Merit-cum-Means scholarship support for students belonging to notified religious minority communities of West Bengal.',
    array['student', 'scholarship', 'minority', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Direct benefit transfer covering course fees and maintenance stipends for eligible minority students in West Bengal.',
    'পশ্চিমবঙ্গের সংখ্যালঘু সম্প্রদায়ের শিক্ষার্থীদের জন্য বার্ষিক আর্থিক অনুদান ও বৃত্তি।',
    '₹2,500 to ₹15,000 per year direct DBT'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Aikyashree Guidelines (WBMDFC)', 'https://wbmdfcscholarship.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Clause 2.0 Domicile & Income Criteria', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'income_certificate', true, 'Competent authority family income certificate (<= ₹2,50,000)'),
    (v_id, 'bonafide_certificate', true, 'Bonafide certificate / current fee receipt'),
    (v_id, 'class_10_marksheet', false, 'Previous examination marksheet (minimum 50% marks)'),
    (v_id, 'bank_passbook', true, 'Personal bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Student Registration on WBMDFC', 'ডব্লিউবিএমডিএফসি পোর্টালে নিবন্ধন', 'Visit wbmdfcscholarship.in and click Student Registration. Select your district and minority community.', src_id),
    (v_id, 2, 'Complete Application Form', 'আবেদনপত্র পূরণ', 'Provide institution details, academic scores, and IFSC/Bank account numbers.', src_id),
    (v_id, 3, 'Institutional Verification', 'প্রাতিষ্ঠানিক যাচাইকরণ', 'Submit the signed copy to your school or college for verification and onward transmission.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 5. NSP Central Sector Post-Matric Scholarship for SC/ST Students
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'nsp-post-matric-sc-st',
    'NSP Post-Matric Scholarship for SC/ST Students',
    'কেন্দ্রীয় সরকার পোস্ট-ম্যাট্রিক স্কলারশিপ (এসসি ও এসটি শিক্ষার্থীদের জন্য)',
    'Ministry of Social Justice and Empowerment / Ministry of Tribal Affairs, Government of India',
    'central', null, 'education',
    'https://scholarships.gov.in',
    'Central Government scholarship supporting Scheduled Caste and Scheduled Tribe students studying at post-matriculation or post-secondary stage across India.',
    array['student', 'scholarship', 'sc', 'st', 'education', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Comprehensive scholarship providing complete reimbursement of compulsory fees and non-refundable academic expenses plus monthly maintenance allowance.',
    'টিউশন ফি এবং মাসিক রক্ষণাবেক্ষণ ভাতা সরাসরি ব্যাঙ্ক অ্যাকাউন্টে প্রদান।',
    'Full course fee reimbursement + ₹550 to ₹1,200 monthly allowance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'National Scholarship Portal Guidelines', 'https://scholarships.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Clause 3.0 Income & Post-Matric Academic Requirement', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000),
        jsonb_build_object('field', 'has_passed_class_10', 'op', 'is_true')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'caste_certificate', true, 'Digital SC/ST Caste Certificate issued by revenue authority'),
    (v_id, 'income_certificate', true, 'Income certificate issued by competent authority (<= ₹2.5 Lakh)'),
    (v_id, 'class_10_marksheet', true, 'Secondary (Class 10) marksheet copy'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Generate OTR on National Scholarship Portal', 'এনএসপি পোর্টালে ওয়ান-টাইম রেজিস্ট্রেশন', 'Visit scholarships.gov.in and complete One-Time Registration (OTR) with Aadhaar FaceRD or biometric authentication.', src_id),
    (v_id, 2, 'Apply for Post-Matric SC/ST Scheme', 'স্কলারশিপ আবেদন জমা', 'Select the Ministry of Social Justice scheme, verify institute AISHE code, and upload documents.', src_id),
    (v_id, 3, 'Level 1 & Level 2 Digital Verification', 'ডিজিটাল যাচাইকরণ', 'Institute verifies the student through the INO portal; State nodal officer sanctions DBT payment.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 6. Indira Gandhi National Widow Pension Scheme (IGNWPS) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'ignwps-widow-pension',
    'Indira Gandhi National Widow Pension Scheme (IGNWPS)',
    'ইন্দিরা গান্ধী জাতীয় বিধবা পেনশন প্রকল্প',
    'Ministry of Rural Development, Government of India (NSAP)',
    'central', null, 'social_welfare',
    'https://nsap.nic.in',
    'Monthly central social security pension for widows aged 40 to 79 living below the poverty line.',
    array['widow', 'women', 'bpl', 'social_welfare', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly financial pension credited directly into the bank or post office account of the widow beneficiary.',
    '৪০ থেকে ৭৯ বছর বয়সী বিধবাদের জন্য মাসিক আর্থিক পেনশন সহায়তা।',
    '₹1,000 monthly pension assistance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'NSAP Official Guidelines', 'https://nsap.nic.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'NSAP Guidelines Clause 4.1 Age & Widowhood Requirement', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'marital_status', 'op', 'eq', 'value', 'widowed'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 40),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 79)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'death_certificate', true, 'Death certificate of deceased husband'),
    (v_id, 'income_certificate', true, 'BPL certificate or local Gram Panchayat income certificate'),
    (v_id, 'bank_passbook', true, 'Single bank or post office passbook'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity & age'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Obtain NSAP Application Form', 'এনএসএপি আবেদনপত্র সংগ্রহ', 'Collect the physical NSAP pension form from the local Gram Panchayat, BDO Office, or Municipality.', src_id),
    (v_id, 2, 'Attach Death & Age Proof', 'নথি সংযুক্তিকরণ', 'Attach deceased husband death certificate, age verification, and BPL/income proof.', src_id),
    (v_id, 3, 'Approval by Social Welfare Section', 'সমাজকল্যাণ বিভাগে অনুমোদন', 'BDO or Sub-Divisional Officer verifies and enters the sanctioned beneficiary onto nsap.nic.in.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 7. Indira Gandhi National Old Age Pension Scheme (IGNOAPS) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'ignoaps-old-age-pension',
    'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    'ইন্দিরা গান্ধী জাতীয় বার্ধক্য পেনশন প্রকল্প',
    'Ministry of Rural Development, Government of India (NSAP)',
    'central', null, 'social_welfare',
    'https://nsap.nic.in',
    'Non-contributory monthly central pension for elderly citizens aged 60 and above living below the poverty line.',
    array['elderly', 'retired', 'bpl', 'social_welfare', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly non-contributory pension for citizens aged 60 years or above with enhanced allowance after age 80.',
    '৬০ বছর বা তদূর্ধ্ব বয়স্ক নাগরিকদের জন্য মাসিক পেনশন। ৮০ বছর পূর্ণ হলে বর্ধিত হারে পেনশন প্রাপ্য।',
    '₹1,000 per month (₹1,500/month after age 80)'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'NSAP Old Age Pension Guidelines', 'https://nsap.nic.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'NSAP Guidelines Clause 2.1 Age Minimum 60 Years & Income Cap', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 60),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 100000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Birth certificate, school certificate, or age certificate from Chief Medical Officer'),
    (v_id, 'income_certificate', true, 'BPL document or family income certificate (<= ₹1 Lakh)'),
    (v_id, 'bank_passbook', true, 'Active savings bank or postal account passbook'),
    (v_id, 'voter_id_card', true, 'Voter ID card'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Application at BDO / Municipality', 'বিডিও বা পৌরসভায় আবেদনপত্র জমা', 'Fill the NSAP old-age pension form and submit to the Gram Panchayat or Municipal ward office.', src_id),
    (v_id, 2, 'Field Verification by Panchayat / Ward Inspector', 'মাঠ পর্যায়ের যাচাইকরণ', 'The local inspector verifies age and residential status.', src_id),
    (v_id, 3, 'Sanction & Direct Credit to Account', 'অনুমোদন ও সরাসরি অ্যাকাউন্টে টাকা প্রদান', 'Sanction order is issued and monthly pension is deposited via DBT.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 8. Taposili Bandhu Pension Scheme (SC Old Age Pension) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'taposili-bandhu',
    'Taposili Bandhu Pension Scheme (SC Senior Citizens)',
    'তপশিলী বন্ধু পেনশন প্রকল্প (৬০+ এসসি নাগরিকদের জন্য)',
    'Backward Classes Welfare Department, Government of West Bengal',
    'state', 'West Bengal', 'social_welfare',
    'https://jaibangla.wb.gov.in',
    'State social security pension of ₹1,000 per month for all Scheduled Caste senior citizens aged 60 and above in West Bengal who are not covered under other pensions.',
    array['sc', 'elderly', 'retired', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly non-contributory pension of ₹1,000 per month for SC elderly citizens under Jai Bangla Scheme.',
    'পশ্চিমবঙ্গের ৬০ বছর বা তদূর্ধ্ব তপশিলী জাতিভুক্ত প্রবীণ নাগরিকদের জন্য মাসিক ১,০০০ টাকা ভাতা।',
    '₹1,000 per month pension assistance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Jai Bangla WB Portal', 'https://jaibangla.wb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Jai Bangla Gazette Notification Section 3.1 Age & Domicile', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 60)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'caste_certificate', true, 'Valid SC Caste Certificate issued by competent West Bengal authority'),
    (v_id, 'birth_certificate', true, 'Proof of age (Aadhaar / Voter ID / Birth Certificate showing 60+ years)'),
    (v_id, 'bank_passbook', true, 'Single bank passbook copy for direct monthly transfer'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of state residence'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Collect Jai Bangla Form B', 'জয় বাংলা ফর্ম সংগ্রহ', 'Obtain Form B at the local Duare Sarkar Camp, BDO Office, or SDO Office.', src_id),
    (v_id, 2, 'Submit at Duare Sarkar Camp or BDO Office', 'দুয়ারে সরকার ক্যাম্প বা বিডিও অফিসে জমা', 'Attach copy of SC certificate, digital ration card or voter card, and bank passbook.', src_id),
    (v_id, 3, 'Approval and Monthly Payment', 'অনুমোদন ও মাসিক ভাতা প্রদান', 'Once approved by the District Magistrate, ₹1,000 is directly credited to your account each month.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 9. Jai Johar Pension Scheme (ST Old Age Pension) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'jai-johar',
    'Jai Johar Pension Scheme (ST Senior Citizens)',
    'জয় জোহার পেনশন প্রকল্প (৬০+ এসটি নাগরিকদের জন্য)',
    'Tribal Development Department, Government of West Bengal',
    'state', 'West Bengal', 'social_welfare',
    'https://jaibangla.wb.gov.in',
    'Monthly social security pension of ₹1,000 for Scheduled Tribe senior citizens aged 60 and above residing in West Bengal.',
    array['st', 'elderly', 'retired', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly pension of ₹1,000 disbursed directly through DBT for Scheduled Tribe elders.',
    'পশ্চিমবঙ্গের ৬০ বছর বা তদূর্ধ্ব তপশিলী উপজাতিভুক্ত (এসটি) প্রবীণ নাগরিকদের জন্য মাসিক ১,০০০ টাকা ভাতা।',
    '₹1,000 per month pension assistance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Jai Bangla WB Portal', 'https://jaibangla.wb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Jai Bangla Gazette Notification Section 4.1 ST Domicile & Age', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 60)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'caste_certificate', true, 'Valid ST Certificate issued by SDO or competent authority'),
    (v_id, 'birth_certificate', true, 'Proof of age 60+ (Voter ID or Aadhaar)'),
    (v_id, 'bank_passbook', true, 'Bank account passbook copy for DBT'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Collect Application Form', 'আবেদনপত্র সংগ্রহ', 'Get Jai Bangla Form B from the nearest Duare Sarkar camp or BDO office.', src_id),
    (v_id, 2, 'Submit with ST Certificate', 'এসটি সার্টিফিকেট সহ জমা', 'Submit with self-attested copies of ST certificate, age proof, and bank passbook.', src_id),
    (v_id, 3, 'Disbursement', 'মাসিক ভাতা প্রদান', 'Monthly ₹1,000 is directly credited to your bank account after verification.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 10. Sukanya Samriddhi Yojana (SSY) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'sukanya-samriddhi',
    'Sukanya Samriddhi Yojana (SSY)',
    'সুকন্যা সমৃদ্ধি যোজনা',
    'Ministry of Finance, Government of India',
    'central', null, 'women',
    'https://www.indiapost.gov.in',
    'High-interest government-backed small savings scheme for girl children below 10 years of age with full tax exemption under Section 80C.',
    array['girl', 'teenage', 'children', 'women', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Special high-yield deposit account (currently 8.2% annual compound interest) maturity on girl child reaching 21 years.',
    '১০ বছর পর্যন্ত কন্যাশিশুর জন্য বিশেষ সঞ্চয় প্রকল্প (বার্ষিক ৮.২% সুদ এবং আয়কর ছাড়)।',
    '8.2% p.a. guaranteed interest + Section 80C tax exemption'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'India Post Small Savings Schemes', 'https://www.indiapost.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Rule 3.1 Eligibility (Girl Child Under 10 Years)', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 10)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Birth certificate of the girl child showing date of birth and parents names'),
    (v_id, 'residence_certificate', true, 'Address and identity proof of guardian'),
    (v_id, 'passport_photo', true, 'Passport photographs of child and legal guardian'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Visit Post Office or Commercial Bank', 'ডাকঘর বা ব্যাঙ্কে যোগাযোগ', 'Visit any post office branch or authorized public/private commercial bank.', src_id),
    (v_id, 2, 'Submit Account Opening Form (SSA-1)', 'এসএসএ-১ ফর্ম জমা', 'Submit the Sukanya Samriddhi account opening form with birth certificate and guardian KYC.', src_id),
    (v_id, 3, 'Deposit Initial Amount', 'প্রাথমিক অর্থ জমা', 'Deposit initial amount (minimum ₹250) and receive passbook for ongoing deposits.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 11. Swasthya Sathi Cashless Health Cover (₹5 Lakh) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'swasthya-sathi',
    'Swasthya Sathi Cashless Health Scheme (₹5 Lakh)',
    'স্বাস্থ্য সাথী ক্যাশলেস স্বাস্থ্য বীমা প্রকল্প (৫ লক্ষ টাকা)',
    'Health and Family Welfare Department, Government of West Bengal',
    'state', 'West Bengal', 'health',
    'https://swasthyasathi.gov.in',
    'Comprehensive cashless secondary and tertiary hospitalization cover up to ₹5,00,000 per family per annum issued in the name of the eldest woman member of the household.',
    array['health', 'women', 'general', 'sc', 'st', 'obc', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Smart card based paperless & cashless medical treatment up to ₹5 Lakh/family across all government and empaneled private hospitals.',
    'পরিবার পিছু বার্ষিক ৫ লক্ষ টাকা পর্যন্ত বিনামূল্যে চিকিৎসার সুবিধা (স্মার্ট কার্ড ভিত্তিক)।',
    '₹5,00,000 annual cashless family hospitalization coverage'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Swasthya Sathi Official Portal', 'https://swasthyasathi.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Cabinet Order Domicile Requirement (Universal WB Residents)', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Digital Ration Card / Khadya Sathi card of family members'),
    (v_id, 'passport_photo', true, 'Recent photograph of the eldest woman head of the family'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Form B at Duare Sarkar Camp', 'দুয়ারে সরকার ক্যাম্পে ফর্ম বি জমা', 'Visit the nearest Duare Sarkar camp and submit Form B with family ration cards.', src_id),
    (v_id, 2, 'Biometric Enrollment & Smart Card Issuance', 'বায়োমেট্রিক তথ্য ও কার্ড গ্রহণ', 'The eldest woman member provides biometric verification and receives the laminated smart card.', src_id),
    (v_id, 3, 'Present Card at Empaneled Hospitals', 'হাসপাতালে কার্ড প্রদর্শন', 'Present the card at any government or empaneled private hospital for immediate cashless admission.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 12. Ayushman Bharat PM-JAY (₹5 Lakh Health Cover) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'ayushman-bharat-pmjay',
    'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    'আয়ুষ্মান ভারত প্রধানমন্ত্রী জন আরোগ্য যোজনা (পিএম-জেএওয়াই)',
    'National Health Authority, Government of India',
    'central', null, 'health',
    'https://pmjay.gov.in',
    'World largest health assurance scheme providing health cover of ₹5,00,000 per family per year for secondary and tertiary care hospitalization across India.',
    array['health', 'bpl', 'general', 'sc', 'st', 'obc', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    '₹5,00,000 annual cashless coverage for over 1,900 surgical and medical treatment packages.',
    'প্রতি পরিবারের জন্য বছরে ৫ লক্ষ টাকা পর্যন্ত ক্যাশলেস চিকিৎসার সুবিধা সমগ্র ভারতে।',
    '₹5,00,000 nationwide cashless hospitalization'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PM-JAY Portal', 'https://pmjay.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'SECC 2011 Deprivation & Low Income Threshold', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Food security / NFSA / BPL ration card copy'),
    (v_id, 'voter_id_card', true, 'Voter ID card'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Verify Name on PM-JAY Portal / CSC', 'পোর্টালে নাম যাচাই', 'Visit beneficiary.nha.gov.in or any Common Service Center (CSC) to check SECC eligibility.', src_id),
    (v_id, 2, 'Complete e-KYC', 'ই-কেওয়াইসি সম্পন্নকরণ', 'Complete e-KYC using Aadhaar OTP or fingerprint authentication.', src_id),
    (v_id, 3, 'Download Ayushman Card', 'আয়ুষ্মান কার্ড ডাউনলোড', 'Download digital PVC Ayushman Card for instant cashless admission at 27,000+ empaneled hospitals.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 13. PM Vishwakarma Scheme - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-vishwakarma',
    'PM Vishwakarma Scheme (Artisans & Craftspeople)',
    'প্রধানমন্ত্রী বিশ্বকর্মা যোজনা (কারিগর ও শিল্পীদের জন্য)',
    'Ministry of Micro, Small and Medium Enterprises, Government of India',
    'central', null, 'employment',
    'https://pmvishwakarma.gov.in',
    'Comprehensive holistic support for traditional artisans and craftspeople (carpenters, blacksmiths, goldsmiths, potters, sculptors, cobblers, tailors) with collateral-free enterprise loans and toolkit incentive.',
    array['artisan', 'self_employed', 'obc', 'sc', 'st', 'employment', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'PM Vishwakarma Certificate & ID card, skill upgradation stipend of ₹500/day, ₹15,000 toolkit grant, and up to ₹3,00,000 enterprise loans at 5% interest.',
    'প্রশিক্ষণকালীন দৈনিক ৫০০ টাকা ভাতা, ১৫,০০০ টাকার টুলকিট অনুদান এবং ৫% সুদে ৩ লক্ষ টাকা পর্যন্ত ঋণ।',
    '₹15,000 toolkit grant + ₹3,00,000 loan at 5% interest'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PM Vishwakarma Guidelines', 'https://pmvishwakarma.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 3.1 Traditional Artisan Age Minimum 18', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account for stipend and loan credit'),
    (v_id, 'skill_certificate', false, 'Skill certificate or traditional trade self-declaration'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply through Common Service Center (CSC)', 'সিএসসি কেন্দ্রে আবেদন', 'Visit nearest CSC with Aadhaar and bank passbook to enroll in your trade (carpentry, pottery, etc.).', src_id),
    (v_id, 2, 'Three-Tier Verification', 'ত্রিস্তরীয় যাচাইকরণ', 'Gram Panchayat Pradhan / Municipality Ward Committee conducts stage 1 verification.', src_id),
    (v_id, 3, 'Skill Training & Toolkit Disbursement', 'প্রশিক্ষণ ও টুলকিট লাভ', 'Attend 5-7 days basic skill training with ₹500/day stipend; receive ₹15,000 digital toolkit incentive.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 14. Krishak Bandhu - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'krishak-bandhu',
    'Krishak Bandhu (Assured Income & Life Insurance)',
    'কৃষক বন্ধু (নিশ্চিত আয় ও জীবন বীমা)',
    'Department of Agriculture, Government of West Bengal',
    'state', 'West Bengal', 'agriculture',
    'https://krishakbandhu.wb.gov.in',
    'Financial assistance of up to ₹10,000 per year in two installments for farmers and recorded sharecroppers, plus ₹2,00,000 death benefit for families.',
    array['farmer', 'agriculture', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Bi-annual direct payment before Kharif and Rabi seasons based on agricultural landholding, with minimum ₹4,000/year.',
    'পশ্চিমবঙ্গের কৃষকদের জন্য বছরে সর্বোচ্চ ১০,০০০ টাকা (নূন্যতম ৪,০০০ টাকা) কৃষি সহায়তা এবং ২ লক্ষ টাকার জীবন বীমা।',
    'Up to ₹10,000/year crop assistance + ₹2,00,000 family death benefit'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Krishak Bandhu Portal Guidelines', 'https://krishakbandhu.wb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Clause 2.1 Land Possession & Age Requirement', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 60)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'land_record', true, 'RoR (Parcha) showing agricultural landownership or recorded bargadar status'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity in West Bengal'),
    (v_id, 'bank_passbook', true, 'Single bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Application at ADA Office or Duare Sarkar', 'সহ-কৃষি অধিকর্তা অফিস বা দুয়ারে সরকারে জমা', 'Fill Krishak Bandhu Form and attach copy of updated RoR/Parcha and bank passbook.', src_id),
    (v_id, 2, 'Land Verification by Revenue Inspector', 'জমির রেকর্ড যাচাই', 'Agricultural development officer verifies land details with BL&LRO records.', src_id),
    (v_id, 3, 'Bi-annual DBT Credit', 'ডিবিটি মাধ্যমে অর্থ প্রদান', 'Assistance is credited before Kharif (June) and Rabi (November) seasons directly into your bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 15. Lakshmir Bhandar - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'lakshmir-bhandar',
    'Lakshmir Bhandar (Women Financial Independence)',
    'লক্ষ্মীর ভাণ্ডার (নারীদের আর্থিক সুরক্ষা প্রকল্প)',
    'Department of Women & Child Development and Social Welfare, Government of West Bengal',
    'state', 'West Bengal', 'women',
    'https://socialwelfare.wb.gov.in',
    'Universal monthly financial support of ₹1,000 for General category women and ₹1,200 for SC/ST women aged 25 to 60 in West Bengal.',
    array['women', 'general', 'sc', 'st', 'obc', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly non-contributory cash support for female household members.',
    'পশ্চিমবঙ্গের ২৫ থেকে ৬০ বছর বয়সী মহিলাদের জন্য মাসিক ১,০০০ টাকা (সাধারণ) এবং ১,২০০ টাকা (এসসি/এসটি) আর্থিক সহায়তা।',
    '₹1,000 to ₹1,200 monthly direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Lakshmir Bhandar Guidelines', 'https://socialwelfare.wb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Clause 3.0 Domicile, Gender & Age Eligibility', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 25),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 60)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'bank_passbook', true, 'Single bank account in applicant name (Aadhaar linked)'),
    (v_id, 'passport_photo', true, 'Recent passport size photo of the woman applicant'),
    (v_id, 'caste_certificate', false, 'SC/ST certificate copy for enhanced ₹1,200 monthly rate'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Obtain Form at Duare Sarkar Camp', 'দুয়ারে সরকার ক্যাম্প থেকে ফর্ম সংগ্রহ', 'Collect Lakshmir Bhandar application form at your local Duare Sarkar camp.', src_id),
    (v_id, 2, 'Submit Form with Swasthya Sathi & Bank Details', 'ফর্ম জমা ও নথি সংযুক্তকরণ', 'Enclose copies of Swasthya Sathi card, bank passbook, and Aadhaar.', src_id),
    (v_id, 3, 'Approval and Monthly Payment', 'অনুমোদন ও মাসিক অর্থ প্রদান', 'Monthly allowance is credited directly to the woman single bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 16. Yuvasree - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'yuvasree-scheme',
    'Yuvasree (Employment Assistance Scheme)',
    'যুবশ্রী (কর্মসংস্থান সহায়তা প্রকল্প)',
    'Labour Department, Government of West Bengal',
    'state', 'West Bengal', 'employment',
    'https://employmentbankwb.gov.in',
    'Monthly unemployment assistance of ₹1,500 for registered unemployed jobseekers in West Bengal pursuing skill training.',
    array['unemployed', 'youth', 'employment', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly stipend of ₹1,500 to help unemployed youth bear skill training and exam preparation expenses.',
    'পশ্চিমবঙ্গের কর্মহীন যুবকদের দক্ষতা বৃদ্ধি ও চাকরির প্রস্তুতির জন্য মাসিক ১,৫০০ টাকা সহায়তা।',
    '₹1,500 monthly unemployment stipend'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Employment Bank WB Guidelines', 'https://employmentbankwb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Clause 1.1 Unemployed Status & Age 18-45', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'is_unemployed', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 45),
        jsonb_build_object('field', 'has_passed_class_10', 'op', 'is_true')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'employment_registration', true, 'Valid Employment Bank registration proof (Annexure-I)'),
    (v_id, 'class_10_pass_certificate', true, 'Class 10 or Madhyamik pass certificate'),
    (v_id, 'bank_passbook', true, 'Applicant bank account passbook copy'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of residence in West Bengal'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Register on Employment Bank Portal', 'এমপ্লয়মেন্ট ব্যাংকে নিবন্ধন', 'Register online on employmentbankwb.gov.in and generate Enrolment Number.', src_id),
    (v_id, 2, 'Physical Document Verification at SDO', 'এসডিও অফিসে নথি যাচাই', 'Visit the Employment Exchange with originals within 60 days to activate the profile.', src_id),
    (v_id, 3, 'Submit Annexure-I and Annexure-II', 'অ্যানেক্সার জমা প্রদান', 'Submit Annexure-I when selected in Yuvasree waiting list, followed by bi-annual Annexure-II course proofs.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 17. PM-KISAN - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-kisan',
    'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    'প্রধানমন্ত্রী কিষাণ সম্মান নিধি (পিএম-কিষাণ)',
    'Ministry of Agriculture and Farmers Welfare, Government of India',
    'central', null, 'agriculture',
    'https://pmkisan.gov.in',
    'Income support of ₹6,000 per year in three equal installments to all landholding farmer families across India.',
    array['farmer', 'agriculture', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Three equal installments of ₹2,000 every four months directly into farmer bank accounts linked with Aadhaar.',
    'সমগ্র ভারতের ভূমিধারী কৃষক পরিবারগুলির জন্য বছরে ৬,০০০ টাকা (তিনটি কিস্তিতে ২,০০০ টাকা করে) আর্থিক সহায়তা।',
    '₹6,000 per year direct income transfer (3 x ₹2,000)'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PM-KISAN Guidelines', 'https://pmkisan.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Clause 2.1 Landholding Farmer Family & Age Minimum 18', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'land_record', true, 'Land ownership document (Khatauni / Jamabandi / Parcha)'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank passbook copy for DBT'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'New Farmer Registration on pmkisan.gov.in', 'পোর্টালে কৃষক নিবন্ধন', 'Visit Farmers Corner on pmkisan.gov.in and click New Farmer Registration.', src_id),
    (v_id, 2, 'Complete e-KYC', 'ই-কেওয়াইসি সম্পন্নকরণ', 'Complete OTP-based eKYC or biometric eKYC at any Common Service Center.', src_id),
    (v_id, 3, 'State Verification & Fund Transfer', 'রাজ্য সরকার কর্তৃক যাচাই ও অর্থ প্রদান', 'State Agriculture Department verifies land records and disburses ₹2,000 tri-annual installments.', src_id)
  on conflict do nothing;

end $$;
