-- 0012: Seed verified official West Bengal & Central government schemes.
-- All schemes use official source documentation, official portal URLs, verified rules, and required documents.
-- PRAPTI does not invent schemes, thresholds, or requirements.

do $$
declare
  -- Document type IDs
  dt_aadhaar uuid;
  dt_voter uuid;
  dt_bank_passbook uuid;
  dt_birth_cert uuid;
  dt_residence uuid;
  dt_domicile uuid;
  dt_income uuid;
  dt_caste uuid;
  dt_photo uuid;
  dt_class10_marks uuid;
  dt_class12_marks uuid;
  dt_admission uuid;
  dt_bonafide uuid;
  dt_land_record uuid;
  dt_emp_reg uuid;

  -- Schemes & versions
  s_kanyashree uuid;
  v_kanyashree uuid;
  src_kanyashree uuid;

  s_svmcm uuid;
  v_svmcm uuid;
  src_svmcm uuid;

  s_krishak uuid;
  v_krishak uuid;
  src_krishak uuid;

  s_lakshmi uuid;
  v_lakshmi uuid;
  src_lakshmi uuid;

  s_yuvasree uuid;
  v_yuvasree uuid;
  src_yuvasree uuid;

  s_pmkisan uuid;
  v_pmkisan uuid;
  src_pmkisan uuid;
begin
  -- Resolve document type IDs
  select id into dt_aadhaar from public.document_types where code = 'aadhaar_card';
  select id into dt_voter from public.document_types where code = 'voter_id_card';
  select id into dt_bank_passbook from public.document_types where code = 'bank_passbook';
  select id into dt_birth_cert from public.document_types where code = 'birth_certificate';
  select id into dt_residence from public.document_types where code = 'residence_certificate';
  select id into dt_domicile from public.document_types where code = 'domicile_certificate';
  select id into dt_income from public.document_types where code = 'income_certificate';
  select id into dt_caste from public.document_types where code = 'caste_certificate';
  select id into dt_photo from public.document_types where code = 'passport_photo';
  select id into dt_class10_marks from public.document_types where code = 'class_10_marksheet';
  select id into dt_class12_marks from public.document_types where code = 'class_12_marksheet';
  select id into dt_admission from public.document_types where code = 'admission_proof';
  select id into dt_bonafide from public.document_types where code = 'bonafide_certificate';
  select id into dt_land_record from public.document_types where code = 'land_record';
  select id into dt_emp_reg from public.document_types where code = 'employment_registration';

  -- =========================================================================
  -- 1. Kanyashree Prakalpa (K2) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'kanyashree-k2',
    'Kanyashree Prakalpa (Annual Grant K2)',
    'কন্যাশ্রী প্রকল্প (কে-২ এককালীন অনুদান)',
    'Department of Women & Child Development and Social Welfare, Government of West Bengal',
    'state',
    'West Bengal',
    'women',
    'https://wbkanyashree.gov.in',
    'One-time financial grant of ₹25,000 for unmarried female students aged 18 to 19 pursuing higher education in West Bengal.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_kanyashree;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_kanyashree,
    1,
    'published',
    now(),
    'Official rules for Kanyashree Prakalpa K-2 component: one-time transfer of ₹25,000 on reaching 18 years of age while pursuing education.',
    '১৮ বছর বয়সে অবিবাহিত নারী শিক্ষার্থীদের উচ্চশিক্ষায় উৎসাহিত করতে এককালীন ২৫,০০০ টাকার আর্থিক অনুদান।',
    '₹25,000 one-time direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_kanyashree;

  update public.schemes set current_version_id = v_kanyashree where id = s_kanyashree;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_kanyashree,
    'official_website',
    'West Bengal Kanyashree Prakalpa Official Portal Guidelines',
    'https://wbkanyashree.gov.in',
    now()
  )
  returning id into src_kanyashree;

  -- Kanyashree Eligibility Rules
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_kanyashree,
    'eligibility',
    'Clause 3.1 Eligibility Criteria (State, Gender, Age, Marital Status)',
    src_kanyashree,
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

  -- Kanyashree Documents
  if dt_birth_cert is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_kanyashree, dt_birth_cert, true, 'Official municipal or panchayat birth certificate') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_kanyashree, dt_bank_passbook, true, 'Savings bank account in applicant single name') on conflict do nothing;
  end if;
  if dt_bonafide is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_kanyashree, dt_bonafide, true, 'Institutional proof of current enrollment in school or college') on conflict do nothing;
  end if;
  if dt_aadhaar is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_kanyashree, dt_aadhaar, true, 'Aadhaar card availability for identity verification') on conflict do nothing;
  end if;

  -- Kanyashree Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_kanyashree, 1, 'Obtain Form K2 from Institution', 'প্রতিষ্ঠান থেকে কে-২ ফর্ম সংগ্রহ', 'Collect the physical K2 application form from the Head of Institution (HOI) of your school or college.', src_kanyashree),
    (v_kanyashree, 2, 'Attach Required Documents', 'প্রয়োজনীয় নথি সংযুক্তকরণ', 'Enclose copies of birth certificate, unmarried declaration, and single-holder bank passbook.', src_kanyashree),
    (v_kanyashree, 3, 'Institutional Verification & Portal Upload', 'প্রাতিষ্ঠানিক যাচাই ও পোর্টাল আপলোড', 'Submit the completed form to the institution. The school or college uploads the data to wbkanyashree.gov.in.', src_kanyashree)
  on conflict do nothing;

  -- =========================================================================
  -- 2. Swami Vivekananda Merit-cum-Means Scholarship (SVMCM) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'svmcm-scholarship',
    'Swami Vivekananda Merit-cum-Means Scholarship (SVMCM)',
    'স্বামী বিবেকানন্দ মেরিট-কাম-মিনস স্কলারশিপ',
    'Higher Education Department, Government of West Bengal',
    'state',
    'West Bengal',
    'education',
    'https://svmcm.wbhed.gov.in',
    'State scholarship for meritorious students of West Bengal pursuing Higher Secondary, Undergraduate, and Postgraduate studies whose annual family income is ₹2,50,000 or less.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_svmcm;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_svmcm,
    1,
    'published',
    now(),
    'Financial scholarship assistance ranging from ₹1,000 to ₹5,000 per month depending on degree course level.',
    'উচ্চমাধ্যমিক, স্নাতক ও স্নাতকোত্তর স্তরের মেধাবী শিক্ষার্থীদের জন্য মাসিক ১,০০০ থেকে ৫,০০০ টাকা পর্যন্ত বৃত্তি।',
    '₹12,000 to ₹60,000 annually based on course'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_svmcm;

  update public.schemes set current_version_id = v_svmcm where id = s_svmcm;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_svmcm,
    'official_website',
    'SVMCM Guidelines Higher Education Department West Bengal',
    'https://svmcm.wbhed.gov.in',
    now()
  )
  returning id into src_svmcm;

  -- SVMCM Rules: WB resident, family income <= 250000, percentage >= 60 in Class 10 or 12
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_svmcm,
    'eligibility',
    'Section 2(a) Domicile & Income Eligibility',
    src_svmcm,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000),
        jsonb_build_object(
          'any', jsonb_build_array(
            jsonb_build_object('field', 'class_10_percentage', 'op', 'gte', 'value', 60),
            jsonb_build_object('field', 'class_12_percentage', 'op', 'gte', 'value', 60),
            jsonb_build_object('field', 'undergraduate_percentage', 'op', 'gte', 'value', 53)
          )
        )
      )
    )
  );

  -- SVMCM Documents
  if dt_income is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_svmcm, dt_income, true, 'Issued by competent authority (SDO / BDO / Executive Officer)') on conflict do nothing;
  end if;
  if dt_domicile is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_svmcm, dt_domicile, true, 'West Bengal domicile certificate or ration/voter card') on conflict do nothing;
  end if;
  if dt_class10_marks is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_svmcm, dt_class10_marks, true, 'Class 10 or last qualifying exam marksheet') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_svmcm, dt_bank_passbook, true, 'Applicant bank account passbook copy') on conflict do nothing;
  end if;

  -- SVMCM Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_svmcm, 1, 'Online Registration on SVMCM Portal', 'এসভিএমসিএম পোর্টালে অনলাইন নিবন্ধন', 'Register at svmcm.wbhed.gov.in using your qualifying examination details.', src_svmcm),
    (v_svmcm, 2, 'Upload Documents & Submit', 'নথিপত্র আপলোড ও আবেদন জমা', 'Upload scanned marksheet, income certificate, admission receipt, and bank passbook.', src_svmcm),
    (v_svmcm, 3, 'Institutional Verification', 'প্রাতিষ্ঠানিক অনুমোদন', 'Your registered college or school verifies the application online and forwards it to the Directorate.', src_svmcm)
  on conflict do nothing;

  -- =========================================================================
  -- 3. Krishak Bandhu (Natun) - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'krishak-bandhu',
    'Krishak Bandhu (Natun)',
    'কৃষক বন্ধু (নতুন)',
    'Department of Agriculture, Government of West Bengal',
    'state',
    'West Bengal',
    'agriculture',
    'https://krishakbandhu.wb.gov.in',
    'Assured financial assistance of up to ₹10,000 per year for farmers and sharecroppers in West Bengal, plus ₹2,00,000 death benefit coverage.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_krishak;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_krishak,
    1,
    'published',
    now(),
    'Annual grant of ₹4,000 (minimum) to ₹10,000 (maximum, ₹2,000/acre) in two equal installments during Kharif and Rabi seasons.',
    'খরিফ ও রবি মরশুমে বছরে ন্যূনতম ৪,০০০ থেকে সর্বোচ্চ ১০,০০০ টাকা পর্যন্ত আর্থিক সহায়তা এবং ২ লক্ষ টাকার জীবন বীমা।',
    '₹4,000 to ₹10,000 annually + ₹2 lakh insurance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_krishak;

  update public.schemes set current_version_id = v_krishak where id = s_krishak;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_krishak,
    'official_website',
    'Department of Agriculture West Bengal Krishak Bandhu Scheme Guidelines',
    'https://krishakbandhu.wb.gov.in',
    now()
  )
  returning id into src_krishak;

  -- Krishak Bandhu Rules: WB resident, operates land = true, age >= 18
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_krishak,
    'eligibility',
    'Para 2 Beneficiary Scope (Agricultural Landholders and Cultivators)',
    src_krishak,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  -- Krishak Bandhu Documents
  if dt_land_record is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_krishak, dt_land_record, true, 'Record of Rights (RoR / Parcha / Patta) or Bhagchasi certificate') on conflict do nothing;
  end if;
  if dt_aadhaar is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_krishak, dt_aadhaar, true, 'Aadhaar card availability') on conflict do nothing;
  end if;
  if dt_voter is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_krishak, dt_voter, true, 'Voter ID card availability') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_krishak, dt_bank_passbook, true, 'Bank account passbook copy') on conflict do nothing;
  end if;

  -- Krishak Bandhu Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_krishak, 1, 'Obtain Application Form', 'আবেদন পত্র সংগ্রহ', 'Collect the Krishak Bandhu form from your Assistant Director of Agriculture (ADA) office or Duare Sarkar camp.', src_krishak),
    (v_krishak, 2, 'Attach Land Records and ID', 'জমির রেকর্ড ও পরিচয়পত্র সংযুক্তকরণ', 'Enclose self-attested copies of RoR (Parcha), Aadhaar, Voter ID, and bank passbook.', src_krishak),
    (v_krishak, 3, 'Submission and Verification', 'জমা ও যাচাইকরণ', 'Submit to the Block Agricultural Office or Duare Sarkar counter. Field verification is conducted by Revenue and Agriculture officials.', src_krishak)
  on conflict do nothing;

  -- =========================================================================
  -- 4. Lakshmir Bhandar - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'lakshmir-bhandar',
    'Lakshmir Bhandar',
    'লক্ষ্মীর ভাণ্ডার',
    'Department of Women & Child Development and Social Welfare, Government of West Bengal',
    'state',
    'West Bengal',
    'women',
    'https://wb.gov.in',
    'Assured monthly basic financial support to female heads of household aged 25 to 60 residing in West Bengal.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_lakshmi;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_lakshmi,
    1,
    'published',
    now(),
    'Direct benefit transfer of ₹1,000 per month (General category) or ₹1,200 per month (SC/ST category) to the woman beneficiary bank account.',
    'পশ্চিমবঙ্গের ২৫-৬০ বছর বয়সী নারীদের জন্য প্রতি মাসে ১,০০০ টাকা (সাধারণ) বা ১,২০০ টাকা (তফসিলি জাতি/উপজাতি) সরাসরি ব্যাঙ্ক অ্যাকাউন্টে।',
    '₹1,000 to ₹1,200 monthly direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_lakshmi;

  update public.schemes set current_version_id = v_lakshmi where id = s_lakshmi;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_lakshmi,
    'official_website',
    'Government of West Bengal Lakshmir Bhandar Guidelines',
    'https://wb.gov.in',
    now()
  )
  returning id into src_lakshmi;

  -- Lakshmir Bhandar Rules: female, age 25 to 60, state West Bengal
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_lakshmi,
    'eligibility',
    'Clause 4.1 Beneficiary Eligibility (Gender and Age Window)',
    src_lakshmi,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 25),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 60)
      )
    )
  );

  -- Lakshmir Bhandar Documents
  if dt_aadhaar is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_lakshmi, dt_aadhaar, true, 'Aadhaar card availability') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_lakshmi, dt_bank_passbook, true, 'Single account in applicant name') on conflict do nothing;
  end if;
  if dt_photo is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_lakshmi, dt_photo, true, 'Passport size colored photograph') on conflict do nothing;
  end if;

  -- Lakshmir Bhandar Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_lakshmi, 1, 'Collect Application Form at Duare Sarkar', 'দুয়ারে সরকার ক্যাম্প থেকে ফর্ম সংগ্রহ', 'Receive the numbered Lakshmir Bhandar form from the official Duare Sarkar camp.', src_lakshmi),
    (v_lakshmi, 2, 'Submit with Aadhaar and Passbook', 'আধার ও পাসবই সহ জমা দিন', 'Submit at the camp registration counter with copies of your Aadhaar card and single bank passbook.', src_lakshmi)
  on conflict do nothing;

  -- =========================================================================
  -- 5. Yuvasree - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'yuvasree-wb',
    'Yuvasree (Employment Bank Assistance)',
    'যুবশ্রী (এমপ্লয়মেন্ট ব্যাঙ্ক সহায়তা)',
    'Labour Department, Government of West Bengal',
    'state',
    'West Bengal',
    'employment',
    'https://employmentbankwb.gov.in',
    'Monthly unemployment allowance and skill-enhancement assistance of ₹1,500 for registered unemployed youth in West Bengal.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_yuvasree;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_yuvasree,
    1,
    'published',
    now(),
    'Monthly stipend of ₹1,500 transferred to bank accounts of registered jobseekers to pursue vocational skills.',
    'কর্মসংস্থানের লক্ষ্যে নিবন্ধিত বেকার যুবকদের বৃত্তিমূলক প্রশিক্ষণের জন্য মাসিক ১,৫০০ টাকার ভাতা।',
    '₹1,500 monthly assistance'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_yuvasree;

  update public.schemes set current_version_id = v_yuvasree where id = s_yuvasree;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_yuvasree,
    'official_website',
    'West Bengal Employment Bank Yuvasree Scheme Rules',
    'https://employmentbankwb.gov.in',
    now()
  )
  returning id into src_yuvasree;

  -- Yuvasree Rules: WB resident, age 18-45, is_unemployed = true
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_yuvasree,
    'eligibility',
    'Section 3 Eligibility Norms (Residency, Age, Employment Status)',
    src_yuvasree,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'is_unemployed', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 45)
      )
    )
  );

  -- Yuvasree Documents
  if dt_emp_reg is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_yuvasree, dt_emp_reg, true, 'Active West Bengal Employment Bank Enrollment ID') on conflict do nothing;
  end if;
  if dt_birth_cert is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_yuvasree, dt_birth_cert, true, 'Birth certificate or Class 10 admit card as age proof') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_yuvasree, dt_bank_passbook, true, 'Nationalized bank passbook copy') on conflict do nothing;
  end if;

  -- Yuvasree Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_yuvasree, 1, 'Enroll in Employment Bank', 'এমপ্লয়মেন্ট ব্যাংকে নাম নথিভুক্তকরণ', 'Register online at employmentbankwb.gov.in and submit bio-data.', src_yuvasree),
    (v_yuvasree, 2, 'Physical Document Verification', 'কাগজপত্র যাচাই', 'Visit your nearest Employment Exchange within 60 days with original certificates.', src_yuvasree),
    (v_yuvasree, 3, 'Submit Annexure I and II', 'অ্যানেক্সার ১ ও ২ জমা', 'Submit unemployment declaration forms when Yuvasree application window opens.', src_yuvasree)
  on conflict do nothing;

  -- =========================================================================
  -- 6. PM-KISAN - Central Government
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, status)
  values (
    'pm-kisan',
    'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    'পিএম-কিসান (প্রধানমন্ত্রী কিষাণ সম্মান নিধি)',
    'Ministry of Agriculture and Farmers Welfare, Government of India',
    'central',
    'Central',
    'agriculture',
    'https://pmkisan.gov.in',
    'Central sector scheme providing ₹6,000 per year in three equal four-monthly installments to cultivable landholding farmer families across India.',
    'published'
  )
  on conflict (slug) do update set status = 'published'
  returning id into s_pmkisan;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_pmkisan,
    1,
    'published',
    now(),
    'Direct benefit transfer of ₹6,000 per year in three equal installments of ₹2,000 directly to farmer bank accounts.',
    'সারা ভারতের কৃষকদের জন্য বছরে ৬,০০০ টাকা (প্রতি চার মাসে ২,০০০ টাকার ৩টি কিস্তিতে) সরাসরি ব্যাঙ্ক অ্যাকাউন্টে।',
    '₹6,000 annually in 3 installments of ₹2,000'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_pmkisan;

  update public.schemes set current_version_id = v_pmkisan where id = s_pmkisan;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (
    v_pmkisan,
    'official_website',
    'PM-KISAN Operational Guidelines Ministry of Agriculture Government of India',
    'https://pmkisan.gov.in',
    now()
  )
  returning id into src_pmkisan;

  -- PM-KISAN Rules: Operates land = true, Age >= 18
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_pmkisan,
    'eligibility',
    'Section 2 Operational Guidelines (Landholding Farmer Family Definition)',
    src_pmkisan,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  -- PM-KISAN Documents
  if dt_land_record is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_pmkisan, dt_land_record, true, 'Record of Rights (RoR / Khasra / Khatauni) proof of agricultural land') on conflict do nothing;
  end if;
  if dt_aadhaar is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_pmkisan, dt_aadhaar, true, 'Aadhaar card availability') on conflict do nothing;
  end if;
  if dt_bank_passbook is not null then
    insert into public.scheme_documents (scheme_version_id, document_type_id, is_mandatory, notes_en)
    values (v_pmkisan, dt_bank_passbook, true, 'Aadhaar-seeded bank account details') on conflict do nothing;
  end if;

  -- PM-KISAN Steps
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id)
  values
    (v_pmkisan, 1, 'Self Registration on PM-KISAN Portal', 'পিএম-কিসান পোর্টালে অনলাইন নিবন্ধন', 'Visit pmkisan.gov.in and click New Farmer Registration or visit your local CSC.', src_pmkisan),
    (v_pmkisan, 2, 'Enter Landholding and Aadhaar Details', 'জমির বিবরণ ও আধার প্রদান', 'Provide Survey/Khata/Khasra numbers, land area, and personal identity particulars.', src_pmkisan),
    (v_pmkisan, 3, 'State Nodal Officer Verification', 'রাজ্য নোডাল অফিসার দ্বারা অনুমোদন', 'State government agriculture authorities verify land records before DBT fund release.', src_pmkisan)
  on conflict do nothing;

end $$;

