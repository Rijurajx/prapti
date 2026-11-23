-- 0015: Expanded All-India State and Central Welfare Schemes Registry
-- Seeds Annapurna Bhandar, state schemes across India (Maharashtra, Karnataka, Tamil Nadu, Delhi, UP, Rajasthan, Telangana), and flagship Central schemes.
-- Never stores identity document numbers.

do $$
declare
  s_id uuid;
  v_id uuid;
  src_id uuid;
begin

  -- =========================================================================
  -- 18. Annapurna Bhandar & Rasoi Yojana - Rajasthan
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'rajasthan-annapurna-bhandar',
    'Annapurna Bhandar & Rasoi Yojana (Rajasthan)',
    'অন্নপূর্ণা ভাণ্ডার ও রসুই যোজনা (রাজস্থান)',
    'Food, Civil Supplies and Consumer Affairs Department, Government of Rajasthan',
    'state', 'Rajasthan', 'social_welfare',
    'https://food.rajasthan.gov.in',
    'Provides multi-commodity quality branded grocery items at subsidized fair-price rates and nutritious wholesome cooked meals for ₹8 across urban and rural Rajasthan.',
    array['food_security', 'bpl', 'general', 'sc', 'st', 'obc', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Access to subsidized packaged groceries via Annapurna Bhandar outlets and nutritious meals at ₹8 per thali.',
    'অন্নপূর্ণা রসুই ও ভাণ্ডার কেন্দ্রগুলির মাধ্যমে ৮ টাকায় পুষ্টিকর খাবার এবং ন্যায্য মূল্যে প্রয়োজনীয় খাদ্যদ্রব্য সরবরাহ।',
    'Nutritious meals at ₹8 + Subsidized packaged grocery staples'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Rajasthan Food & Civil Supplies Portal', 'https://food.rajasthan.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 State Domicile Requirement', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Rajasthan')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'NFSA / State ration card (Jan Aadhaar card)'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Locate Nearest Annapurna Bhandar / Rasoi', 'নিকটস্থ কেন্দ্র অনুসন্ধান', 'Visit any FPS Annapurna Bhandar shop or permanent Annapurna Rasoi center in Rajasthan.', src_id),
    (v_id, 2, 'Biometric Verification via POS', 'বায়োমেট্রিক যাচাইকরণ', 'Present ration card / Jan Aadhaar for electronic POS verification.', src_id),
    (v_id, 3, 'Purchase Subsidized Commodities', 'ভর্তুকিযুক্ত সামগ্রী গ্রহণ', 'Collect subsidized food grain packets or meal tokens at ₹8.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 19. Khadya Sathi - Annapurna Scheme - West Bengal
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'wb-khadya-sathi-annapurna',
    'Khadya Sathi - Annapurna Senior Food Scheme (West Bengal)',
    'খাদ্য সাথী - অন্নপূর্ণা প্রবীণ খাদ্য প্রকল্প (পশ্চিমবঙ্গ)',
    'Department of Food & Supplies, Government of West Bengal',
    'state', 'West Bengal', 'social_welfare',
    'https://food.wb.gov.in',
    'Free 10 kg of food grains per month for destitute senior citizens aged 65 and above in West Bengal who are not receiving any state or national pension.',
    array['food_security', 'elderly', 'retired', 'bpl', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Free allocation of 10 kg food grains (rice/wheat) per month under Annapurna category of NFSA.',
    'পশ্চিমবঙ্গের ৬৫ বা তদূর্ধ্ব বয়স্ক নিঃসম্বল নাগরিকদের জন্য প্রতি মাসে সম্পূর্ণ বিনামূল্যে ১০ কেজি খাদ্যশস্য।',
    'Free 10 kg food grains (rice/wheat) per month'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'WB Food & Supplies Official Portal', 'https://food.wb.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'NFSA Guidelines Section 3.2 Age Minimum 65 & Domicile', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'West Bengal'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 65)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Proof of age 65+ (Voter ID or Birth Certificate)'),
    (v_id, 'income_certificate', true, 'Certificate of destitute status from Gram Panchayat / BDO'),
    (v_id, 'ration_card', true, 'Digital Ration Card'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Application at BDO Office or Camp', 'বিডিও অফিসে আবেদন জমা', 'Submit Annapurna ration form with age proof at local BDO office or Duare Sarkar.', src_id),
    (v_id, 2, 'Field Verification by Food Inspector', 'খাদ্য পরিদর্শক কর্তৃক যাচাই', 'Food inspector verifies non-receipt of other pensions and destitute status.', src_id),
    (v_id, 3, 'Collect Free Monthly Ration', 'বিনামূল্যে মাসিক রেশন সংগ্রহ', 'Collect 10 kg free rice from assigned Fair Price Shop each month.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 20. Mukhyamantri Majhi Ladki Bahin Yojana - Maharashtra
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'maharashtra-ladki-bahin',
    'Mukhyamantri Majhi Ladki Bahin Yojana (Maharashtra)',
    'মুখ্যমন্ত্রী মাঝি লাড়কি বহিন যোজনা (মহারাষ্ট্র)',
    'Women and Child Development Department, Government of Maharashtra',
    'state', 'Maharashtra', 'women',
    'https://ladkibahin.maharashtra.gov.in',
    'Direct benefit cash transfer of ₹1,500 per month for married, widowed, divorced, deserted, and destitute women aged 21 to 65 residing in Maharashtra with family income up to ₹2,50,000.',
    array['women', 'girl', 'widow', 'bpl', 'general', 'sc', 'st', 'obc', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly direct transfer of ₹1,500 into the Aadhaar-linked bank account of eligible women.',
    'মহারাষ্ট্রের ২১ থেকে ৬৫ বছর বয়সী মহিলাদের জন্য প্রতি মাসে ১,৫০০ টাকার সরাসরি ব্যাঙ্ক অনুদান।',
    '₹1,500 monthly direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Maharashtra Ladki Bahin Portal', 'https://ladkibahin.maharashtra.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Government Resolution Clause 2.1 State, Gender, Age & Income', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Maharashtra'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 21),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 65),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'domicile_certificate', true, 'Maharashtra Domicile Certificate or 15-year school record'),
    (v_id, 'income_certificate', true, 'Tahsildar Income Certificate (<= ₹2.5 Lakh) or Yellow/Orange Ration Card'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded single bank account passbook copy'),
    (v_id, 'ration_card', true, 'Family Ration Card copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Register on Ladki Bahin Portal or Nari Shakti App', 'লাড়কি বহিন পোর্টালে নিবন্ধন', 'Download the Nari Shakti Doot app or visit ladkibahin.maharashtra.gov.in.', src_id),
    (v_id, 2, 'Upload Documents & e-KYC', 'নথি আপলোড ও ই-কেওয়াইসি', 'Upload Aadhaar, domicile certificate, and income proof; verify via mobile OTP.', src_id),
    (v_id, 3, 'Approval and Monthly Payment', 'অনুমোদন ও মাসিক ভাতা', 'Tahsildar scrutiny committee sanctions eligibility for monthly ₹1,500 DBT.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 21. Namo Shetkari Mahasanman Nidhi - Maharashtra
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'maharashtra-namo-shetkari',
    'Namo Shetkari Mahasanman Nidhi Yojana (Maharashtra)',
    'নমো শেতকারী মহাসম্মান নিধি যোজনা (মহারাষ্ট্র)',
    'Department of Agriculture, Government of Maharashtra',
    'state', 'Maharashtra', 'agriculture',
    'https://krishi.maharashtra.gov.in',
    'Additional financial assistance of ₹6,000 per year in three installments for landholding farmers of Maharashtra, over and above the Central PM-KISAN grant.',
    array['farmer', 'agriculture', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Direct transfer of ₹6,000 annually (combined ₹12,000/year with PM-KISAN) directly into farmer bank accounts.',
    'মহারাষ্ট্রের কৃষকদের জন্য বছরে অতিরিক্ত ৬,০০০ টাকা (পিএম-কিষাণের সাথে মোট ১২,০০০ টাকা) অনুদান।',
    '₹6,000 per year direct farm income grant'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Maharashtra Krishi Vibhag', 'https://krishi.maharashtra.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 State Domicile & Landholding', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Maharashtra'),
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'land_record', true, 'Maharashtra 7/12 (Saat Baara) and 8A land revenue extract'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Link PM-KISAN and Mahadbt', 'মহাডিবিটি পোর্টালে সংযুক্তকরণ', 'Ensure active PM-KISAN registration with Maharashtra 7/12 land records.', src_id),
    (v_id, 2, 'Complete Biometric e-KYC', 'ই-কেওয়াইসি সম্পন্নকরণ', 'Complete Aadhaar eKYC via CSC or PM-KISAN portal.', src_id),
    (v_id, 3, 'Disbursement', 'অর্থ প্রদান', 'Three annual installments of ₹2,000 are deposited alongside central PM-KISAN tranches.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 22. Gruha Lakshmi Scheme - Karnataka
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'karnataka-gruha-lakshmi',
    'Gruha Lakshmi Scheme (Karnataka)',
    'গৃহ লক্ষ্মী যোজনা (কর্ণাটক)',
    'Women and Child Development Department, Government of Karnataka',
    'state', 'Karnataka', 'women',
    'https://sevasindhu.karnataka.gov.in',
    'Monthly financial assistance of ₹2,000 transferred directly to the bank account of the female head of the family listed on Antyodaya, BPL, and APL ration cards in Karnataka.',
    array['women', 'general', 'sc', 'st', 'obc', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly unconditional cash transfer of ₹2,000 to the woman head of household via direct benefit transfer.',
    'কর্ণাটকের পরিবার প্রধান মহিলাদের জন্য প্রতি মাসে ২,০০০ টাকার আর্থিক সুরক্ষা অনুদান।',
    '₹2,000 per month direct bank transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Karnataka Seva Sindhu Portal', 'https://sevasindhu.karnataka.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 1.2 Woman Head of Household & Domicile', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Karnataka'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Karnataka Ration Card (BPL, APL or Antyodaya card showing woman as head)'),
    (v_id, 'bank_passbook', true, 'Aadhaar-linked bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Visit Karnataka One / Grama One Center', 'কর্ণাটক ওয়ান কেন্দ্রে আবেদন', 'Visit nearest Grama One, Bangalore One, or Karnataka One center with ration card and Aadhaar.', src_id),
    (v_id, 2, 'Biometric e-KYC', 'বায়োমেট্রিক তথ্য প্রদান', 'Provide biometric thumb impression or mobile OTP authentication.', src_id),
    (v_id, 3, 'Monthly DBT Credit', 'মাসিক অর্থ জমা', 'Receive ₹2,000 monthly directly into Aadhaar-seeded bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 23. Yuva Nidhi Scheme - Karnataka
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'karnataka-yuva-nidhi',
    'Yuva Nidhi Unemployment Allowance (Karnataka)',
    'যুব নিধি বেকার ভাতা (কর্ণাটক)',
    'Department of Skill Development, Entrepreneurship and Livelihood, Government of Karnataka',
    'state', 'Karnataka', 'employment',
    'https://sevasindhuservices.karnataka.gov.in',
    'Unemployment assistance of ₹3,000 per month for degree holders and ₹1,500 per month for diploma holders of Karnataka who remain unemployed for at least 6 months after passing.',
    array['student', 'unemployed', 'youth', 'employment', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly unemployment allowance up to 2 years or until getting employed/self-employed.',
    'স্নাতক ও ডিপ্লোমাধারী কর্ণাটকের যুবকদের জন্য যথাক্রমে মাসিক ৩,০০০ ও ১,৫০০ টাকা বেকার ভাতা।',
    '₹3,000/month (Degree) or ₹1,500/month (Diploma)'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Karnataka Seva Sindhu Services', 'https://sevasindhuservices.karnataka.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.0 State Domicile, Unemployed Status & Age', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Karnataka'),
        jsonb_build_object('field', 'is_unemployed', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 35)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'degree_certificate', true, 'Degree or Diploma certificate / marks card (NAD / DigiLocker verified)'),
    (v_id, 'domicile_certificate', true, 'Karnataka Domicile / Study certificate of minimum 6 years'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply on Seva Sindhu Yuva Nidhi Portal', 'সেবা সিন্ধু পোর্টালে আবেদন', 'Visit sevasindhuservices.karnataka.gov.in and select Yuva Nidhi Scheme.', src_id),
    (v_id, 2, 'Link Degree Data & DigiLocker', 'ডিজিটাল শংসাপত্র যাচাইকরণ', 'Fetch university degree roll number from state academic repository.', src_id),
    (v_id, 3, 'Monthly Self-Declaration of Unemployment', 'মাসিক স্ব-ঘোষণা প্রদান', 'Submit online self-declaration on the 25th of every month confirming unemployed status.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 24. Kalaignar Magalir Urimai Thittam - Tamil Nadu
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'tamil-nadu-magalir-urimai',
    'Kalaignar Magalir Urimai Thittam (Tamil Nadu)',
    'কালাইঙ্গার মাগালির উরিমাই থিত্তাম (তামিলনাড়ু)',
    'Special Programme Implementation Department, Government of Tamil Nadu',
    'state', 'Tamil Nadu', 'women',
    'https://kmut.tn.gov.in',
    'Basic income financial entitlement of ₹1,000 per month for women heads of eligible households in Tamil Nadu with annual family income below ₹2,50,000.',
    array['women', 'general', 'sc', 'st', 'obc', 'social_welfare', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly unconditional cash transfer of ₹1,000 credited directly into the bank accounts of woman beneficiaries.',
    'তামিলনাড়ুর পরিবার প্রধান মহিলাদের জন্য প্রতি মাসে ১,০০০ টাকার মৌলিক আয় সহায়তা।',
    '₹1,000 monthly basic income transfer'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'KMUT Official Portal', 'https://kmut.tn.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'KMUT Gazette Order Clause 3.1 Age, Gender, Income & Domicile', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Tamil Nadu'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 21),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 250000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Tamil Nadu Smart Family Card (Ration Card)'),
    (v_id, 'bank_passbook', true, 'Single bank account passbook copy (Aadhaar mapped)'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Attend Special Registration Camp', 'বিশেষ ক্যাম্পে অংশগ্রহণ', 'Attend designated ration shop camp in your ward/village with smart card and Aadhaar.', src_id),
    (v_id, 2, 'Biometric Enrollment on KMUT App', 'কেএমইউটি অ্যাপে বায়োমেট্রিক নিবন্ধন', 'Field volunteer conducts biometric verification and takes digital acknowledgment.', src_id),
    (v_id, 3, 'Monthly Payment', 'মাসিক ১,০০০ টাকা জমা', 'Monthly allowance of ₹1,000 is credited via DBT on the 15th of every month.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 25. Pudhumai Penn Scheme - Tamil Nadu
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'tamil-nadu-pudhumai-penn',
    'Pudhumai Penn Higher Education Scheme (Tamil Nadu)',
    'পুধুমাই পেন উচ্চশিক্ষা যোজনা (তামিলনাড়ু)',
    'Social Welfare and Women Empowerment Department, Government of Tamil Nadu',
    'state', 'Tamil Nadu', 'education',
    'https://pudhumaipenn.tn.gov.in',
    'Monthly financial assistance of ₹1,000 for female students who studied from Class 6 to 12 in Tamil Nadu government schools until completion of undergraduate degree, diploma, or ITI.',
    array['student', 'scholarship', 'girl', 'women', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Monthly incentive of ₹1,000 directly into girl students bank accounts throughout their higher degree studies.',
    'সরকারি স্কুলে পড়া নারী শিক্ষার্থীদের উচ্চশিক্ষা সম্পূর্ণ না হওয়া পর্যন্ত প্রতি মাসে ১,০০০ টাকা বৃত্তি।',
    '₹1,000 per month higher education stipend'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Pudhumai Penn Portal', 'https://pudhumaipenn.tn.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 State, Gender, Education & Age', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Tamil Nadu'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'has_passed_class_12', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 17),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 25)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'class_12_marksheet', true, 'Higher Secondary (Class 12) marksheet and EMIS certificate from government school'),
    (v_id, 'bonafide_certificate', true, 'Bonafide certificate of ongoing college degree / diploma enrollment'),
    (v_id, 'bank_passbook', true, 'Student single savings bank passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'College Nodal Officer Enrollment', 'কলেজ নোডাল অফিসারের মাধ্যমে আবেদন', 'Colleges enroll eligible female students via the pudhumaipenn.tn.gov.in portal.', src_id),
    (v_id, 2, 'EMIS Verification', 'ইএমআইএস স্কুল রেকর্ড যাচাই', 'System auto-verifies that the student studied Class 6 to 12 in government schools using state EMIS ID.', src_id),
    (v_id, 3, 'Monthly DBT Sanction', 'মাসিক ১,০০০ টাকা প্রদান', 'Sanctioned amount is deposited each month directly into the student bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 26. Mukhyamantri Kanya Sumangala Yojana - Uttar Pradesh
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'up-kanya-sumangala',
    'Mukhyamantri Kanya Sumangala Yojana (Uttar Pradesh)',
    'মুখ্যমন্ত্রী কন্যা সুমঙ্গলা যোজনা (উত্তরপ্রদেশ)',
    'Women and Child Development Department, Government of Uttar Pradesh',
    'state', 'Uttar Pradesh', 'women',
    'https://mksy.up.gov.in',
    'Financial conditional cash grant of up to ₹25,000 provided in 6 milestones from birth, vaccination, school admissions to graduation for girl children of Uttar Pradesh.',
    array['girl', 'teenage', 'children', 'women', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Graduated financial support up to ₹25,000 transferred in 6 stages to girl children.',
    'উত্তরপ্রদেশের কন্যাশিশুদের জন্মের পর থেকে স্নাতক পর্যন্ত ৬টি ধাপে মোট ২৫,০০০ টাকা আর্থিক অনুদান।',
    'Up to ₹25,000 conditional milestone grant'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'UP MKSY Portal', 'https://mksy.up.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 3.1 Domicile, Gender, Income Cap & Age', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Uttar Pradesh'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 25),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 300000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Birth certificate of girl child'),
    (v_id, 'domicile_certificate', true, 'Uttar Pradesh domicile certificate / residential proof'),
    (v_id, 'income_certificate', true, 'Income certificate (<= ₹3.0 Lakh per annum)'),
    (v_id, 'bank_passbook', true, 'Parent/guardian or joint savings bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Register on MKSY Portal', 'এমকেএসওয়াই পোর্টালে নিবন্ধন', 'Visit mksy.up.gov.in and register Citizen Service account.', src_id),
    (v_id, 2, 'Select Application Stage (Stages 1 to 6)', 'ধাপ নির্বাচন', 'Select stage (birth, vaccination, class 1, 6, 9 or degree entry) and upload certificates.', src_id),
    (v_id, 3, 'Approval and Disbursement', 'অনুমোদন ও অর্থ প্রদান', 'District Probation Officer scrutinizes form and sanctions instalment to bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 27. Delhi Ladli Scheme - Delhi
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'delhi-ladli-scheme',
    'Delhi Ladli Scheme (Government of NCT of Delhi)',
    'দিল্লি লাডলি যোজনা',
    'Department of Women & Child Development, Government of NCT of Delhi',
    'state', 'Delhi', 'women',
    'https://wcddel.in',
    'Financial incentive of up to ₹22,000 deposited in milestones (institutional delivery, Class 1, 6, 9, 10 pass, 12 pass) redeemable at 18 years for girls residing in Delhi.',
    array['girl', 'teenage', 'children', 'women', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Maturity payout of accumulated deposits with compound interest when the girl child turns 18 and passes Class 10.',
    'দিল্লির কন্যাশিশুদের জন্য ১৮ বছর পূর্ণ হলে জমাকৃত অর্থ সুদসহ এককালীন প্রদান।',
    'Up to ₹22,000 milestone deposits maturing at age 18'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Delhi WCD Ladli Portal', 'https://wcddel.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 Residence, Gender, Age & Income', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Delhi'),
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 18),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 100000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Birth Certificate of girl child showing birth in Delhi'),
    (v_id, 'domicile_certificate', true, 'Proof of 3 years continuous residence in Delhi (Ration card / Voter ID)'),
    (v_id, 'income_certificate', true, 'Income Certificate (<= ₹1.0 Lakh per annum) from SDM'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Application at School or WCD District Office', 'স্কুলে বা মহিলা ও শিশুকল্যাণ অফিসে জমা', 'Collect and submit form through recognized government/aided school in Delhi.', src_id),
    (v_id, 2, 'SBIL Fund Certificate Issuance', 'এসবিআই ফান্ড সার্টিফিকেট লাভ', 'State Bank of India issues deposit certificate in child name.', src_id),
    (v_id, 3, 'Claim Maturity at Age 18', '১৮ বছর বয়সে অর্থ উত্তোলন', 'Claim full maturity value after turning 18 and clearing Class 10/12 exams.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 28. Jai Bhim Mukhyamantri Pratibha Vikas Yojana - Delhi
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'delhi-jai-bhim-coaching',
    'Jai Bhim Mukhyamantri Pratibha Vikas Yojana (Delhi)',
    'জয় ভীম মুখ্যমন্ত্রী প্রতিভা বিকাশ যোজনা (দিল্লি)',
    'SC/ST/OBC/Minority Welfare Department, Government of NCT of Delhi',
    'state', 'Delhi', 'education',
    'https://scstwelfare.delhi.gov.in',
    'Free high-quality coaching for competitive examinations (UPSC Civil Services, JEE, NEET, CLAT, Banking) plus ₹2,500 monthly stipend for SC, ST, OBC and EWS students of Delhi.',
    array['student', 'scholarship', 'sc', 'st', 'obc', 'education', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Full course fees paid directly to empaneled coaching institutes + ₹2,500 per month stipend to students for books and travel.',
    'দিল্লির পিছিয়ে পড়া শিক্ষার্থীদের জন্য শীর্ষ কোচিং সেন্টারে বিনামূল্যে প্রবেশিকা প্রশিক্ষণ এবং মাসিক ২,৫০০ টাকা স্টাইপেন্ড।',
    '100% Free Coaching + ₹2,500 monthly student stipend'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Delhi SC/ST Welfare Portal', 'https://scstwelfare.delhi.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.2 Domicile, Academic Pass & Income', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Delhi'),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 800000),
        jsonb_build_object('field', 'has_passed_class_10', 'op', 'is_true')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'caste_certificate', true, 'SC/ST/OBC certificate issued by Revenue Department, GNCTD (or EWS certificate)'),
    (v_id, 'income_certificate', true, 'Income certificate (<= ₹8 Lakh per annum) from competent authority'),
    (v_id, 'class_10_marksheet', true, 'Class 10 and 12 marksheet showing schooling in Delhi'),
    (v_id, 'bank_passbook', true, 'Student single bank account passbook copy for monthly stipend'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply directly at Empaneled Coaching Institute', 'কোচিং ইনস্টিটিউটে আবেদন', 'Visit any empaneled coaching institute (FIITJEE, Vajiram, Aakash, etc.) with caste and income proofs.', src_id),
    (v_id, 2, 'Institute Verification', 'ইনস্টিটিউট কর্তৃক যাচাই', 'Coaching institute uploads student records on scstwelfare.delhi.gov.in for department approval.', src_id),
    (v_id, 3, 'Coaching & Monthly Stipend', 'প্রশিক্ষণ ও মাসিক ভাতা', 'Attend coaching sessions; receive ₹2,500 monthly stipend directly in your bank account.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 29. Rythu Bharosa / Rythu Bandhu - Telangana / AP
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'telangana-rythu-bandhu',
    'Rythu Bharosa / Rythu Bandhu Investment Support',
    'রায়থু ভরসা / রায়থু বন্ধু কৃষক বিনিয়োগ সহায়তা',
    'Agriculture Department, Government of Telangana',
    'state', 'Telangana', 'agriculture',
    'https://rythubandhu.telangana.gov.in',
    'Direct investment support of ₹10,000 per acre per year (₹5,000/acre per season) deposited directly into farmers accounts for purchase of seeds, fertilizers, and field preparation.',
    array['farmer', 'agriculture', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Direct financial grant of ₹5,000 per acre per season (Kharif and Rabi) deposited prior to sowing season.',
    'তেলেঙ্গানার কৃষকদের জন্য একর পিছু বছরে ১০,০০০ টাকা (মরশুম পিছু ৫,০০০ টাকা) কৃষি বিনিয়োগ সহায়তা।',
    '₹10,000 per acre per year direct farm grant'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Rythu Bandhu Portal', 'https://rythubandhu.telangana.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 Landholding Ownership in State', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Telangana'),
        jsonb_build_object('field', 'operates_land', 'op', 'is_true'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'land_record', true, 'Dharani Pattadar Passbook / Digital RoR copy'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Land Record Updation on Dharani Portal', 'ধরণী পোর্টালে জমির তথ্য যাচাই', 'Ensure land ownership is recorded on the Dharani integrated land portal.', src_id),
    (v_id, 2, 'Bank Account Mapping with Agriculture Officer', 'কৃষি অধিকর্তার কাছে অ্যাকাউন্ট জমা', 'Submit bank details to the local Agriculture Extension Officer (AEO).', src_id),
    (v_id, 3, 'Seasonal Direct Benefit Transfer', 'মরশুমি ডিবিটি লাভ', 'Grant of ₹5,000/acre is credited before each agricultural season.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 30. Mukhyamantri Ayushman Rajasthan (Chiranjeevi Health Scheme)
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'rajasthan-chiranjeevi-health',
    'Mukhyamantri Ayushman Rajasthan (Chiranjeevi Health Scheme)',
    'মুখ্যমন্ত্রী আয়ুষ্মান রাজস্থান (চিরঞ্জীবী স্বাস্থ্য বীমা)',
    'Medical, Health & Family Welfare Department, Government of Rajasthan',
    'state', 'Rajasthan', 'health',
    'https://chiranjeevi.rajasthan.gov.in',
    'Provides universal cashless medical health coverage of up to ₹25,00,000 per family per year for secondary and tertiary hospitalization across empaneled hospitals in Rajasthan.',
    array['health', 'general', 'bpl', 'sc', 'st', 'obc', 'state'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, state = excluded.state, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Paperless cashless coverage for hospital procedures, surgeries, ICU, and medications up to ₹25 Lakh.',
    'রাজস্থানের সমস্ত পরিবারের জন্য বছরে সর্বোচ্চ ২৫ লক্ষ টাকা পর্যন্ত ক্যাশলেস চিকিৎসার সম্পূর্ণ কভারেজ।',
    '₹25,00,000 annual family cashless hospitalization'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Chiranjeevi Rajasthan Portal', 'https://chiranjeevi.rajasthan.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 State Domicile Universal Coverage', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'state', 'op', 'eq', 'value', 'Rajasthan')
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Jan Aadhaar Card / Rajasthan Family Identity Card'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Enroll on Jan Aadhaar Portal', 'জন আধার পোর্টালে নিবন্ধন', 'Enroll family on Jan Aadhaar portal through any e-Mitra kiosk.', src_id),
    (v_id, 2, 'Download Digital Policy Document', 'পলিসি নথি ডাউনলোড', 'Download policy confirmation from chiranjeevi.rajasthan.gov.in.', src_id),
    (v_id, 3, 'Present at Empaneled Hospitals', 'হাসপাতালে কার্ড প্রদর্শন', 'Present Jan Aadhaar card at hospital helpdesk for cashless admission.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 31. Pradhan Mantri Awas Yojana (PMAY Housing For All) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-awas-yojana',
    'Pradhan Mantri Awas Yojana (PMAY Housing For All)',
    'প্রধানমন্ত্রী আবাস যোজনা (পিএমএওয়াই পাকা বাড়ি অনুদান)',
    'Ministry of Housing and Urban Affairs / Ministry of Rural Development, Government of India',
    'central', null, 'social_welfare',
    'https://pmaymis.gov.in',
    'Direct financial subsidy of ₹1,20,000 to ₹2,50,000 for construction of a permanent pucca house with basic amenities for houseless and low-income families across urban and rural India.',
    array['bpl', 'general', 'sc', 'st', 'obc', 'social_welfare', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Direct financial subsidy credited in installments directly into beneficiary bank account for pucca house construction.',
    'পাকা বাড়ি তৈরির জন্য সরাসরি ব্যাঙ্ক অ্যাকাউন্টে ১,২০,০০০ থেকে ২,৫০,০০০ টাকার সরকারি অনুদান।',
    '₹1,20,000 to ₹2,50,000 direct housing subsidy'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PMAY Official Portal', 'https://pmaymis.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 EWS/LIG Income Cap & Adult Age', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'family_annual_income_inr', 'op', 'lte', 'value', 300000)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'income_certificate', true, 'Income certificate or BPL proof (<= ₹3 Lakh family income)'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy for milestone DBT credit'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Submit Application via Gram Panchayat or PMAY Portal', 'আবেদন জমা', 'Apply online at pmaymis.gov.in or through local Gram Panchayat / Municipal office.', src_id),
    (v_id, 2, 'Geo-Tagging Inspection of Site', 'জিও-ট্যাগিং পরিদর্শন', 'Block officers visit proposed house plot to capture geotagged photos.', src_id),
    (v_id, 3, 'Staged Disbursement of Funds', 'কিস্তিতে অর্থ প্রদান', 'Subsidy is released in 3-4 milestone installments as foundation, roof, and finishing progress.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 32. Pradhan Mantri Ujjwala Yojana 2.0 (Free LPG) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-ujjwala-yojana',
    'Pradhan Mantri Ujjwala Yojana 2.0 (Free LPG Connection)',
    'প্রধানমন্ত্রী উজ্জ্বলা যোজনা ২.০ (বিনামূল্যে এলপিজি সংযোগ)',
    'Ministry of Petroleum and Natural Gas, Government of India',
    'central', null, 'women',
    'https://pmuy.gov.in',
    'Deposit-free LPG connection along with free first cylinder refill and gas stove, plus ₹300 ongoing targeted subsidy per cylinder for adult women of BPL households across India.',
    array['women', 'bpl', 'sc', 'st', 'general', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Free deposit-free LPG connection, free stove & first refill + ₹300/cylinder ongoing subsidy.',
    'বিনামূল্যে গ্যাস সিলিন্ডার ও ওভেন প্রদান এবং প্রতি সিলিন্ডারে ৩০০ টাকা সরকারি ভর্তুকি।',
    'Free LPG Connection + Free 1st Refill & Stove + ₹300 subsidy/cylinder'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PMUY Official Portal', 'https://pmuy.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'PMUY Guidelines Section 2.1 Adult Woman in Household', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'ration_card', true, 'Ration Card verifying family composition or 14-point declaration'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded single bank account passbook copy'),
    (v_id, 'passport_photo', true, 'Passport size photograph of the female applicant'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply on PMUY Portal or Nearest LPG Distributor', 'গ্যাস ডিস্ট্রিবিউটর বা পোর্টালে আবেদন', 'Submit Ujjwala application at Indian Oil, Bharat Gas, or HP Gas distributor.', src_id),
    (v_id, 2, 'De-duplication Check by OMC', 'তথ্য যাচাইকরণ', 'Oil company verifies applicant does not have an existing active LPG connection.', src_id),
    (v_id, 3, 'Receive Free LPG Connection and Stove', 'বিনামূল্যে সংযোগ ও ওভেন গ্রহণ', 'Collect gas connection passbook, regulator, filled cylinder, and dual-burner stove.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 33. PM SVANidhi (Micro-Credit for Street Vendors) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-svanidhi',
    'PM SVANidhi (Micro-Credit for Street Vendors)',
    'পিএম স্বনিধি (পথ বিক্রেতাদের ক্ষুদ্র ঋণ প্রকল্প)',
    'Ministry of Housing and Urban Affairs, Government of India',
    'central', null, 'employment',
    'https://pmsvanidhi.mohua.gov.in',
    'Collateral-free working capital loan of ₹10,000 (1st tranche), ₹20,000 (2nd tranche), and up to ₹50,000 (3rd tranche) with 7% interest subsidy for street vendors and micro-retailers.',
    array['self_employed', 'employed', 'bpl', 'employment', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Affordable working capital loan up to ₹50,000 with 7% annual interest subsidy and cashback on digital transactions.',
    'পথ বিক্রেতাদের জন্য ৫০,০০০ টাকা পর্যন্ত জামানতমুক্ত ঋণ এবং ৭% সুদে সরকারি ভর্তুকি।',
    '₹10,000 to ₹50,000 collateral-free working capital loan at 7% interest subsidy'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PM SVANidhi Portal', 'https://pmsvanidhi.mohua.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 3.1 Adult Vending Age Minimum 18', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded single bank account passbook copy'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply on PM SVANidhi Portal or CSC', 'সিএসসি বা পোর্টালে আবেদন', 'Log in on pmsvanidhi.mohua.gov.in or visit common service center with Aadhaar-linked mobile.', src_id),
    (v_id, 2, 'Select Lending Bank / MFI', 'ব্যাঙ্ক নির্বাচন', 'Choose preferred commercial bank, regional rural bank, or microfinance institution.', src_id),
    (v_id, 3, 'Loan Sanction and Digital Disbursement', 'ঋণ মঞ্জুর ও বিতরণ', 'Loan amount of ₹10,000 is directly disbursed into vendor bank account within 10 days.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 34. Pradhan Mantri Mudra Yojana (PMMY) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-mudra-yojana',
    'Pradhan Mantri Mudra Yojana (PMMY Business Loans)',
    'প্রধানমন্ত্রী মুদ্রা যোজনা (ব্যবসা ও উদ্যোগ ঋণ)',
    'Department of Financial Services, Ministry of Finance, Government of India',
    'central', null, 'employment',
    'https://mudra.org.in',
    'Collateral-free institutional business loans up to ₹10,00,000 (Shishu: up to ₹50k, Kishore: ₹50k to ₹5L, Tarun: ₹5L to ₹10L) for non-corporate, non-farm small and micro enterprises across India.',
    array['employed', 'self_employed', 'artisan', 'general', 'sc', 'st', 'obc', 'employment', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Collateral-free enterprise credit across Shishu (up to ₹50k), Kishore (₹50k-₹5L), and Tarun (₹5L-₹10L).',
    'ক্ষুদ্র ও মাঝারি ব্যবসার জন্য ১০ লক্ষ টাকা পর্যন্ত জামানতমুক্ত ঋণ সুবিধা সমগ্র ভারতে।',
    'Up to ₹10,00,000 collateral-free business enterprise credit'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'Mudra Portal', 'https://mudra.org.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 Adult Citizen Age Minimum 18', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'pan_card', true, 'PAN Card of the enterprise promoter'),
    (v_id, 'bank_passbook', true, 'Bank statement or passbook of last 6 months'),
    (v_id, 'voter_id_card', true, 'Voter ID card proof of identity'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Apply on Udyamimitra or Bank Branch', 'উদ্যমী মিত্র পোর্টালে আবেদন', 'Apply online via udyamimitra.in or submit Mudra application at any commercial or rural bank.', src_id),
    (v_id, 2, 'Submit Business Proposal', 'ব্যবসায়িক প্রস্তাব জমা', 'Provide quotation for machinery, inventory, or working capital requirement.', src_id),
    (v_id, 3, 'Sanction and Mudra Debit Card', 'ঋণ মঞ্জুর ও মুদ্রা কার্ড', 'Receive loan sanction and Mudra debit card for working capital withdrawals.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 35. Atal Pension Yojana (APY) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'atal-pension-yojana',
    'Atal Pension Yojana (Guaranteed Pension Scheme)',
    'অটল পেনশন যোজনা (নিশ্চিত আজীবন পেনশন)',
    'Pension Fund Regulatory and Development Authority (PFRDA), Government of India',
    'central', null, 'social_welfare',
    'https://npscra.nsdl.co.in',
    'Government-guaranteed monthly lifelong pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000, or ₹5,000 from age 60 for all unorganized sector and employed/self-employed citizens joining between 18 and 40 years.',
    array['employed', 'self_employed', 'retired', 'elderly', 'social_welfare', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Guaranteed monthly pension of ₹1,000 to ₹5,000 for life with spouse continuation and return of corpus to nominee.',
    '৬০ বছর বয়সের পর থেকে আজীবন মাসিক ১,০০০ থেকে ৫,০০০ টাকা সরকারি নিশ্চিত পেনশন।',
    '₹1,000 to ₹5,000 guaranteed monthly lifelong pension'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'APY PFRDA Portal', 'https://npscra.nsdl.co.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'Guidelines Section 2.1 Entry Age Requirement 18 to 40 Years', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 18),
        jsonb_build_object('field', 'age', 'op', 'lte', 'value', 40)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'bank_passbook', true, 'Savings bank account passbook copy with auto-debit facility enabled'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Visit Bank or Net Banking Portal', 'ব্যাঙ্ক বা নেট ব্যাঙ্কিংয়ে আবেদন', 'Visit your bank branch or log in to net banking / mobile banking app.', src_id),
    (v_id, 2, 'Choose Pension Slab and Nominee', 'পেনশন স্ল্যাব নির্বাচন', 'Select pension amount (₹1,000 to ₹5,000) and specify nominee details.', src_id),
    (v_id, 3, 'Receive PRAN Card', 'প্রান কার্ড লাভ', 'PRAN is generated and monthly auto-debit begins based on age at entry.', src_id)
  on conflict do nothing;

  -- =========================================================================
  -- 36. Pradhan Mantri Matru Vandana Yojana (PMMVY) - Central
  -- =========================================================================
  insert into public.schemes (slug, name, name_bn, ministry_label, jurisdiction, state, category, portal_url, short_description, tags, status)
  values (
    'pm-matru-vandana',
    'Pradhan Mantri Matru Vandana Yojana (Maternity Support)',
    'প্রধানমন্ত্রী মাতৃ বন্দনা যোজনা (মাতৃত্বকালীন আর্থিক সহায়তা)',
    'Ministry of Women and Child Development, Government of India',
    'central', null, 'women',
    'https://pmmvy.wcd.gov.in',
    'Direct financial incentive of ₹5,000 to ₹6,000 credited directly into the bank accounts of pregnant women and lactating mothers for health check-ups and wage compensation.',
    array['women', 'girl', 'bpl', 'health', 'central'],
    'published'
  )
  on conflict (slug) do update set
    name = excluded.name, name_bn = excluded.name_bn, tags = excluded.tags, status = 'published'
  returning id into s_id;

  insert into public.scheme_versions (scheme_id, version_number, status, published_at, summary_en, summary_bn, benefit_summary_en)
  values (
    s_id, 1, 'published', now(),
    'Direct benefit transfer of ₹5,000 (1st child in 2 installments) and ₹6,000 (2nd child if girl).',
    'গর্ভবতী ও প্রসূতি মায়েদের জন্য ৫,০০০ থেকে ৬,০০০ টাকার সরাসরি আর্থিক সহায়তা।',
    '₹5,000 to ₹6,000 direct maternity cash benefit'
  )
  on conflict (scheme_id, version_number) do update set status = 'published'
  returning id into v_id;

  update public.schemes set current_version_id = v_id where id = s_id;

  insert into public.scheme_sources (scheme_version_id, source_type, title, url, verified_at)
  values (v_id, 'official_website', 'PMMVY Official Portal', 'https://pmmvy.wcd.gov.in', null)
  returning id into src_id;

  delete from public.scheme_rules where scheme_version_id = v_id;
  insert into public.scheme_rules (scheme_version_id, rule_kind, clause_reference, source_id, rule_json)
  values (
    v_id, 'eligibility', 'PMMVY Guidelines Section 2.1 Female Pregnant / Lactating Mother Age 19+', src_id,
    jsonb_build_object(
      'all', jsonb_build_array(
        jsonb_build_object('field', 'gender', 'op', 'eq', 'value', 'female'),
        jsonb_build_object('field', 'age', 'op', 'gte', 'value', 19)
      )
    )
  );

  delete from public.scheme_documents where scheme_version_id = v_id;
  insert into public.scheme_documents (scheme_version_id, document_code, is_mandatory, notes_en) values
    (v_id, 'birth_certificate', true, 'Mother and Child Protection (MCP) card registration copy'),
    (v_id, 'bank_passbook', true, 'Aadhaar-seeded bank account passbook copy of the mother'),
    (v_id, 'aadhaar_card', true, 'Aadhaar card availability')
  on conflict do nothing;

  delete from public.scheme_application_steps where scheme_version_id = v_id;
  insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, source_id) values
    (v_id, 1, 'Register at Anganwadi Center or ASHA', 'অঙ্গনওয়াড়ি কেন্দ্রে নিবন্ধন', 'Register pregnancy at local Anganwadi center or through ASHA worker.', src_id),
    (v_id, 2, 'Submit Form 1A on PMMVY Portal', 'ফর্ম ১-এ জমা প্রদান', 'Complete registration on pmmvy.wcd.gov.in with MCP card registration proof.', src_id),
    (v_id, 3, 'Receive Instalments via DBT', 'ডিবিটি মাধ্যমে অর্থ লাভ', 'First installment ₹3,000 at registration; second installment ₹2,000 after child birth and immunization.', src_id)
  on conflict do nothing;

end $$;
