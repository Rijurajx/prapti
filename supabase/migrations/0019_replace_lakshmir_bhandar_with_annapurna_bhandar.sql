-- 0019: Replace Lakshmir Bhandar with Annapurna Bhandar (West Bengal)
-- Succeeded in 2026: Universal ₹3,000/month DBT for women aged 25-60 in West Bengal.

alter table public.scheme_versions disable trigger scheme_versions_block_published_edits;

do $$
declare
  v_scheme_id uuid;
  v_version_id uuid;
  v_source_id uuid;
begin
  -- 1. Find the existing Lakshmir Bhandar scheme
  select id, current_version_id into v_scheme_id, v_version_id
  from public.schemes
  where slug = 'lakshmir-bhandar' or name ilike '%Lakshmir Bhandar%'
  limit 1;

  if v_scheme_id is not null then
    -- Update scheme metadata
    update public.schemes
    set
      slug = 'annapurna-bhandar-wb',
      name = 'Annapurna Bhandar (Women Direct Financial Assistance)',
      name_bn = 'অন্নপূর্ণা ভাণ্ডার (Annapurna Bhandar)',
      ministry_label = 'Department of Women & Child Development and Social Welfare, Government of West Bengal',
      category = 'women',
      jurisdiction = 'state',
      state = 'West Bengal',
      tags = array['women', 'general', 'rural', 'urban', 'dbt'],
      portal_url = 'https://wb.gov.in',
      short_description = 'Universal monthly financial assistance of ₹3,000 per month for women residents of West Bengal aged 25 to 60 years (replacing Lakshmir Bhandar).',
      description_en = 'Annapurna Bhandar (Annapurna Yojana) is the flagship universal basic income initiative for women in West Bengal. Effective 2026, it succeeded Lakshmir Bhandar, expanding and standardizing monthly assistance to a flat ₹3,000 per month (₹36,000 annually) directly deposited into Aadhaar-linked bank accounts for all eligible women aged 25 to 60.',
      description_bn = 'অন্নপূর্ণা ভাণ্ডার পশ্চিমবঙ্গের নারীদের জন্য সর্বজনীন আর্থিক সহায়তা প্রকল্প। ২০২৬ সাল থেকে পূর্বতন লক্ষ্মীর ভাণ্ডারের পরিবর্তে ২৫ থেকে ৬০ বছর বয়সী যোগ্য নারীদের প্রতি মাসে ৩,০০০ টাকা সরাসরি ব্যাংক অ্যাকাউন্টে প্রদান করা হয়।',
      updated_at = now()
    where id = v_scheme_id;

    -- Update scheme version
    if v_version_id is not null then
      update public.scheme_versions
      set
        summary_en = 'Flat ₹3,000 monthly financial assistance transferred via DBT directly into bank account of eligible women aged 25–60 in West Bengal.',
        summary_bn = 'পশ্চিমবঙ্গের ২৫ থেকে ৬০ বছর বয়সী নারীদের প্রতি মাসে ৩,০০০ টাকা সরাসরি ব্যাংক অ্যাকাউন্টে সহায়তা।',
        benefit_summary_en = '₹3,000 per month (₹36,000 annually) direct benefit transfer into beneficiary bank account.',
        benefit_summary_bn = 'প্রতি মাসে ৩,০০০ টাকা সরাসরি ব্যাংক অ্যাকাউন্টে।'
      where id = v_version_id;

      -- Update application steps
      delete from public.scheme_application_steps where scheme_version_id = v_version_id;

      insert into public.scheme_application_steps (scheme_version_id, step_order, title_en, title_bn, body_en, body_bn)
      values
        (
          v_version_id,
          1,
          'Collect Application Form at Local Camp or BDO Office',
          'ক্যাম্প বা বিডিও অফিস থেকে অন্নপূর্ণা ভাণ্ডার ফর্ম সংগ্রহ',
          'Obtain the official Annapurna Bhandar application form at your nearest Duare Sarkar camp or local BDO / Municipality office.',
          'আপনার নিকটস্থ দুয়ারে সরকার ক্যাম্প বা স্থানীয় বিডিও / পৌরসভা অফিস থেকে সরকারি অন্নপূর্ণা ভাণ্ডার ফর্ম সংগ্রহ করুন।'
        ),
        (
          v_version_id,
          2,
          'Attach Aadhaar, Active Bank Passbook & Photograph',
          'আধার কার্ড, সক্রিয় ব্যাংক পাসবই ও ছবি যুক্ত করুন',
          'Attach clear self-attested copies of your Aadhaar card, active bank account passbook, and recent passport-sized photograph.',
          'আধার কার্ড, সক্রিয় ব্যাংক একাউন্টের পাসবই এবং সাম্প্রতিক পাসপোর্ট ছবির প্রতিলিপি সংযুক্ত করুন।'
        ),
        (
          v_version_id,
          3,
          'Aadhaar-Seeded Bank Account Verification',
          'আধার-যুক্ত ব্যাংক অ্যাকাউন্ট যাচাই',
          'Ensure your bank account is seeded with Aadhaar and NPCI-mapped for direct benefit transfer (DBT).',
          'সরাসরি সরকারি সুবিধা (DBT) পাওয়ার জন্য আপনার ব্যাংক অ্যাকাউন্ট আধার-সংযুক্ত রয়েছে কিনা তা নিশ্চিত করুন।'
        ),
        (
          v_version_id,
          4,
          'Receive Monthly ₹3,000 DBT Benefit',
          'প্রতি মাসে ৩,০০০ টাকা সরাসরি অ্যাকাউন্টে গ্রহণ',
          'Once official verification is complete, ₹3,000 is credited automatically to your bank account every month.',
          'যাচাইকরণ সম্পন্ন হলে প্রতি মাসে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্টে ৩,০০০ টাকা জমা হবে।'
        );
    end if;
  end if;
end $$;

alter table public.scheme_versions enable trigger scheme_versions_block_published_edits;
