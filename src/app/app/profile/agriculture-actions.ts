'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOwnCitizenId, type ActionResult } from './actions';
import {
  agriculturalProfileSchema,
  type AgriculturalProfileInput,
  type AgriculturalProfile,
} from '@/lib/validation/agriculture';

type AgricultureRow = {
  occupation_types: AgriculturalProfile['occupationTypes'] | null;
  landholding_area: number | string | null;
  landholding_unit: AgriculturalProfile['landholdingUnit'];
  land_state: string | null;
  land_district: string | null;
  crops: string | null;
  irrigation: AgriculturalProfile['irrigation'];
  cultivation_pattern: AgriculturalProfile['cultivationPattern'];
};

const SAVE_ERROR_MESSAGE = 'We could not save your details. Please try again.';

// 1. Agricultural profile

export async function getAgriculturalProfile(): Promise<AgriculturalProfile | null> {
  const citizenId = await getOwnCitizenId();
  if (!citizenId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('citizen_agricultural_profiles')
    .select(
      'occupation_types, landholding_area, landholding_unit, land_state, land_district, crops, irrigation, cultivation_pattern',
    )
    .eq('citizen_id', citizenId)
    .maybeSingle();

  if (error) {
    console.error('getAgriculturalProfile failed', error.code);
    return null;
  }

  const row = data as AgricultureRow | null;
  if (!row) {
    return {
      occupationTypes: [],
      landholdingArea: null,
      landholdingUnit: null,
      landState: null,
      landDistrict: null,
      crops: null,
      irrigation: null,
      cultivationPattern: null,
    };
  }

  return {
    occupationTypes: row.occupation_types ?? [],
    landholdingArea: row.landholding_area !== null ? Number(row.landholding_area) : null,
    landholdingUnit: row.landholding_unit ?? null,
    landState: row.land_state ?? null,
    landDistrict: row.land_district ?? null,
    crops: row.crops ?? null,
    irrigation: row.irrigation ?? null,
    cultivationPattern: row.cultivation_pattern ?? null,
  };
}

export async function saveAgriculturalProfile(
  input: AgriculturalProfileInput,
): Promise<ActionResult> {
  const parsed = agriculturalProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Please sign in again' };
  }

  const citizenId = await getOwnCitizenId();
  if (!citizenId) {
    return {
      ok: false,
      error: 'Your profile could not be found. Try signing out and in again.',
    };
  }

  const { error } = await supabase.from('citizen_agricultural_profiles').upsert(
    {
      citizen_id: citizenId,
      occupation_types: parsed.data.occupationTypes,
      landholding_area: parsed.data.landholdingArea,
      landholding_unit: parsed.data.landholdingUnit,
      land_state: parsed.data.landState,
      land_district: parsed.data.landDistrict,
      crops: parsed.data.crops,
      irrigation: parsed.data.irrigation,
      cultivation_pattern: parsed.data.cultivationPattern,
    },
    { onConflict: 'citizen_id' },
  );

  if (error) {
    console.error('saveAgriculturalProfile failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/app/profile/agriculture');
  return { ok: true };
}
