// Script to seed or update the Demo account for judges
const { createClient } = require('@supabase/supabase-js');

async function seedDemo() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const email = 'demo@prapti.app';
  const password = 'DemoUser2025!';

  console.log('1. Checking if demo user exists...');
  const { data: userList } = await supabase.auth.admin.listUsers();
  let user = userList.users.find((u) => u.email === email);

  if (!user) {
    console.log('Creating demo user in auth.users...');
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Daughter' },
    });
    if (createErr) {
      console.error('Failed to create user:', createErr);
      process.exit(1);
    }
    user = newUser.user;
  } else {
    console.log('Demo user exists; updating password and metadata...');
    await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Daughter' },
    });
  }

  const userId = user.id;
  console.log('User ID:', userId);

  // 2. Ensure user_profiles row
  await supabase.from('user_profiles').upsert({
    id: userId,
    full_name: 'Demo Daughter',
    preferred_language: 'en',
  });

  // 3. Clear existing citizen profiles for clean repeatable seeding
  const { data: existingCitizens } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', userId);

  if (existingCitizens && existingCitizens.length > 0) {
    console.log(`Cleaning ${existingCitizens.length} old citizen profiles...`);
    for (const c of existingCitizens) {
      await supabase.from('citizen_profiles').delete().eq('id', c.id);
    }
  }

  // 4. Create Main Citizen: Demo Daughter
  console.log('Creating Demo Daughter (Main)...');
  const { data: daughter, error: dErr } = await supabase
    .from('citizen_profiles')
    .insert({
      owner_user_id: userId,
      display_name: 'Demo Daughter',
      relationship_to_owner: 'self',
      category_tags: ['student', 'unemployed', 'women', 'general', 'rural'],
    })
    .select()
    .single();

  if (dErr || !daughter) {
    console.error('Error creating daughter profile:', dErr);
    process.exit(1);
  }

  const daughterId = daughter.id;

  // Daughter personal details (24 years old)
  await supabase.from('citizen_personal_details').insert({
    citizen_id: daughterId,
    date_of_birth: '2002-05-15',
    gender: 'female',
    marital_status: 'never_married',
  });

  // Daughter address
  await supabase.from('citizen_addresses').insert({
    citizen_id: daughterId,
    kind: 'current',
    state: 'West Bengal',
    district: 'Nadia',
    village_or_town: 'Krishnanagar',
    area_type: 'rural',
    pin_code: '741235',
    domicile_confirmed: true,
  });

  // Daughter education: Class 12 & Undergraduate B.Sc
  console.log('Adding educational records for Demo Daughter...');
  const { error: eduErr } = await supabase.from('education_records').insert([
    {
      citizen_id: daughterId,
      level: 'class_12',
      board_or_university: 'West Bengal Council of Higher Secondary Education (WBCHSE)',
      institution: 'Krishnanagar Debnath High School',
      stream: 'science',
      programme: 'Higher Secondary (Pure Science)',
      passing_year: 2020,
      is_currently_pursuing: false,
      marking_scale: 'percentage',
      obtained_marks: 420,
      maximum_marks: 500,
      percentage: 84.0,
      marksheet_available: 'available',
      pass_certificate_available: 'available',
    },
    {
      citizen_id: daughterId,
      level: 'undergraduate',
      board_or_university: 'University of Kalyani',
      institution: 'Krishnagar Government College',
      stream: 'science',
      programme: 'Bachelor of Science (B.Sc Honours in Computer Science)',
      passing_year: 2023,
      is_currently_pursuing: false,
      marking_scale: 'percentage',
      obtained_marks: 624,
      maximum_marks: 800,
      percentage: 78.0,
      marksheet_available: 'available',
      pass_certificate_available: 'available',
    },
  ]);
  if (eduErr) {
    console.error('Failed to insert education records:', eduErr);
  }

  // Daughter employment
  await supabase.from('citizen_employment_profiles').insert({
    citizen_id: daughterId,
    employment_status: 'unemployed',
    primary_occupation: 'Job Seeker / Higher Studies Applicant',
    is_government_employee: false,
    monthly_income_inr: 0,
  });

  // Daughter finance
  await supabase.from('citizen_financial_profiles').insert({
    citizen_id: daughterId,
    family_annual_income_inr: 120000,
    ration_card_type: 'rksy_2',
    is_bpl: false,
    has_bank_account: true,
  });

  // Daughter assets: User explicitly requested NO cars, NO house, NO agricultural property
  await supabase.from('citizen_asset_profiles').insert({
    citizen_id: daughterId,
    owns_two_wheeler: false,
    two_wheeler_count: 0,
    owns_four_wheeler: false,
    four_wheeler_count: 0,
    owns_house: false,
    house_count: 0,
    owns_land: false,
    land_area_acres: 0,
    owns_agricultural_equipment: false,
    has_kisan_credit_card: false,
  });

  // Daughter documents
  const daughterDocs = [
    { code: 'aadhaar_card', status: 'available' },
    { code: 'voter_id_card', status: 'available' },
    { code: 'ration_card', status: 'available' },
    { code: 'bank_passbook', status: 'available' },
    { code: 'class_10_marksheet', status: 'available' },
    { code: 'class_10_pass_certificate', status: 'available' },
    { code: 'class_12_marksheet', status: 'available' },
    { code: 'class_12_pass_certificate', status: 'available' },
    { code: 'income_certificate', status: 'available' },
    { code: 'residence_certificate', status: 'available' },
    { code: 'passport_photo', status: 'available' },
    { code: 'caste_certificate', status: 'not_applicable' },
    { code: 'disability_certificate', status: 'not_applicable' },
  ];

  for (const doc of daughterDocs) {
    await supabase.from('citizen_document_inventory').insert({
      citizen_id: daughterId,
      document_code: doc.code,
      status: doc.status,
    });
  }

  // 5. Create Demo Father
  console.log('Creating Demo Father (61, retired, pension, assets)...');
  const { data: father, error: fErr } = await supabase
    .from('citizen_profiles')
    .insert({
      owner_user_id: userId,
      display_name: 'Demo Father',
      relationship_to_owner: 'father',
      category_tags: ['senior_citizen', 'farmer', 'pensioner', 'elderly', 'rural'],
    })
    .select()
    .single();

  if (fErr || !father) {
    console.error('Error creating father profile:', fErr);
    process.exit(1);
  }

  const fatherId = father.id;

  // Father personal details (61 years old)
  await supabase.from('citizen_personal_details').insert({
    citizen_id: fatherId,
    date_of_birth: '1965-02-10',
    gender: 'male',
    marital_status: 'married',
  });

  // Father address
  await supabase.from('citizen_addresses').insert({
    citizen_id: fatherId,
    kind: 'current',
    state: 'West Bengal',
    district: 'Nadia',
    village_or_town: 'Krishnanagar',
    area_type: 'rural',
    pin_code: '741235',
    domicile_confirmed: true,
  });

  // Father employment
  await supabase.from('citizen_employment_profiles').insert({
    citizen_id: fatherId,
    employment_status: 'retired',
    primary_occupation: 'Pensioner & Small Farmer',
    is_government_employee: false,
    monthly_income_inr: 15000,
  });

  // Father finance
  await supabase.from('citizen_financial_profiles').insert({
    citizen_id: fatherId,
    family_annual_income_inr: 180000,
    ration_card_type: 'sphh',
    is_bpl: false,
    has_bank_account: true,
  });

  // Father agriculture
  await supabase.from('citizen_agricultural_profiles').insert({
    citizen_id: fatherId,
    is_farmer: true,
    land_holding_acres: 1.5,
    land_ownership_type: 'owned',
    farmer_category: 'small',
    has_kisan_credit_card: true,
  });

  // Father assets: User requested vehicle, house, agricultural land, etc.
  await supabase.from('citizen_asset_profiles').insert({
    citizen_id: fatherId,
    owns_two_wheeler: true,
    two_wheeler_count: 1,
    owns_four_wheeler: false,
    four_wheeler_count: 0,
    owns_house: true,
    house_count: 1,
    house_type: 'pucca',
    owns_land: true,
    land_area_acres: 1.5,
    land_type: 'agricultural',
    owns_agricultural_equipment: true,
    agricultural_equipment_details: 'Irrigation pump set and power tiller',
    has_kisan_credit_card: true,
    kcc_credit_limit_inr: 50000,
    has_refrigerator: true,
  });

  // Father documents
  const fatherDocs = [
    { code: 'aadhaar_card', status: 'available' },
    { code: 'voter_id_card', status: 'available' },
    { code: 'ration_card', status: 'available' },
    { code: 'bank_passbook', status: 'available' },
    { code: 'land_record', status: 'available' },
    { code: 'farmer_registration', status: 'available' },
    { code: 'residence_certificate', status: 'available' },
    { code: 'passport_photo', status: 'available' },
  ];

  for (const doc of fatherDocs) {
    await supabase.from('citizen_document_inventory').insert({
      citizen_id: fatherId,
      document_code: doc.code,
      status: doc.status,
    });
  }

  // 6. Create Demo Mother
  console.log('Creating Demo Mother (54, housewife)...');
  const { data: mother, error: mErr } = await supabase
    .from('citizen_profiles')
    .insert({
      owner_user_id: userId,
      display_name: 'Demo Mother',
      relationship_to_owner: 'mother',
      category_tags: ['women', 'homemaker', 'nutrition', 'health', 'rural'],
    })
    .select()
    .single();

  if (mErr || !mother) {
    console.error('Error creating mother profile:', mErr);
    process.exit(1);
  }

  const motherId = mother.id;

  // Mother personal details (54 years old)
  await supabase.from('citizen_personal_details').insert({
    citizen_id: motherId,
    date_of_birth: '1972-08-20',
    gender: 'female',
    marital_status: 'married',
  });

  // Mother address
  await supabase.from('citizen_addresses').insert({
    citizen_id: motherId,
    kind: 'current',
    state: 'West Bengal',
    district: 'Nadia',
    village_or_town: 'Krishnanagar',
    area_type: 'rural',
    pin_code: '741235',
    domicile_confirmed: true,
  });

  // Mother employment
  await supabase.from('citizen_employment_profiles').insert({
    citizen_id: motherId,
    employment_status: 'unemployed',
    primary_occupation: 'Homemaker',
    is_government_employee: false,
    monthly_income_inr: 0,
  });

  // Mother finance
  await supabase.from('citizen_financial_profiles').insert({
    citizen_id: motherId,
    family_annual_income_inr: 180000,
    ration_card_type: 'sphh',
    is_bpl: false,
    has_bank_account: true,
  });

  // Mother assets
  await supabase.from('citizen_asset_profiles').insert({
    citizen_id: motherId,
    owns_two_wheeler: false,
    two_wheeler_count: 0,
    owns_four_wheeler: false,
    four_wheeler_count: 0,
    owns_house: false,
    house_count: 0,
    owns_land: false,
    land_area_acres: 0,
    owns_agricultural_equipment: false,
    has_kisan_credit_card: false,
  });

  // Mother documents
  const motherDocs = [
    { code: 'aadhaar_card', status: 'available' },
    { code: 'voter_id_card', status: 'available' },
    { code: 'ration_card', status: 'available' },
    { code: 'bank_passbook', status: 'available' },
    { code: 'residence_certificate', status: 'available' },
    { code: 'passport_photo', status: 'available' },
  ];

  for (const doc of motherDocs) {
    await supabase.from('citizen_document_inventory').insert({
      citizen_id: motherId,
      document_code: doc.code,
      status: doc.status,
    });
  }

  // 7. Enrolled Schemes for Demo Family:
  // Fetch scheme IDs for PM-KISAN, Krishak Bandhu, and Annapurna Bhandar (WB)
  const { data: allSchemes } = await supabase
    .from('schemes')
    .select('id, name, slug');

  if (allSchemes) {
    const pmKisan = allSchemes.find(
      (s) => s.slug?.includes('kisan') || s.name?.includes('PM-KISAN') || s.name?.includes('Kisan Samman'),
    );
    const krishakBandhu = allSchemes.find(
      (s) => s.slug?.includes('krishak') || s.name?.includes('Krishak Bandhu'),
    );
    const annapurnaBhandar = allSchemes.find(
      (s) => s.slug === 'annapurna-bhandar-wb' || s.name?.includes('Women Direct Financial Assistance'),
    );

    if (pmKisan && fatherId) {
      console.log('Enrolling Father into PM-KISAN...');
      await supabase.from('citizen_enrolled_schemes').upsert({
        citizen_id: fatherId,
        scheme_id: pmKisan.id,
      });
    }

    if (krishakBandhu && fatherId) {
      console.log('Enrolling Father into Krishak Bandhu...');
      await supabase.from('citizen_enrolled_schemes').upsert({
        citizen_id: fatherId,
        scheme_id: krishakBandhu.id,
      });
    }

    if (annapurnaBhandar && motherId) {
      console.log('Enrolling Mother into Annapurna Bhandar (West Bengal)...');
      await supabase.from('citizen_enrolled_schemes').upsert({
        citizen_id: motherId,
        scheme_id: annapurnaBhandar.id,
      });
    }
  }

  console.log('Demo Family Account successfully seeded!');
  console.log('Email: demo@prapti.app');
  console.log('Password: DemoUser2025!');
}

seedDemo().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
