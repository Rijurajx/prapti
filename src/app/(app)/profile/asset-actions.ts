'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOwnCitizenId, type ActionResult } from './actions';
import {
  assetProfileSchema,
  DEFAULT_ASSET_PROFILE,
  type AssetProfileInput,
  type AssetProfile,
  type HouseType,
  type LandType,
} from '@/lib/validation/assets';

type AssetRow = {
  owns_two_wheeler: boolean | null;
  two_wheeler_count: number | null;
  owns_four_wheeler: boolean | null;
  four_wheeler_count: number | null;
  owns_house: boolean | null;
  house_count: number | null;
  house_type: HouseType | null;
  owns_land: boolean | null;
  land_area_acres: number | string | null;
  land_type: LandType | null;
  owns_agricultural_equipment: boolean | null;
  agricultural_equipment_details: string | null;
  has_refrigerator: boolean | null;
  has_air_conditioner: boolean | null;
  owns_commercial_property: boolean | null;
  has_kisan_credit_card: boolean | null;
  kcc_credit_limit_inr: number | string | null;
};

const SAVE_ERROR_MESSAGE = 'We could not save your asset details. Please try again.';

export async function getAssetProfile(explicitCitizenId?: string): Promise<AssetProfile> {
  const citizenId = explicitCitizenId || (await getOwnCitizenId());
  if (!citizenId) {
    return DEFAULT_ASSET_PROFILE;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return DEFAULT_ASSET_PROFILE;
  }

  const { data, error } = await supabase
    .from('citizen_asset_profiles')
    .select(
      `owns_two_wheeler,
       two_wheeler_count,
       owns_four_wheeler,
       four_wheeler_count,
       owns_house,
       house_count,
       house_type,
       owns_land,
       land_area_acres,
       land_type,
       owns_agricultural_equipment,
       agricultural_equipment_details,
       has_refrigerator,
       has_air_conditioner,
       owns_commercial_property,
       has_kisan_credit_card,
       kcc_credit_limit_inr`,
    )
    .eq('citizen_id', citizenId)
    .maybeSingle();

  if (error) {
    console.error('getAssetProfile failed', error.code);
    return DEFAULT_ASSET_PROFILE;
  }

  const row = data as AssetRow | null;
  if (!row) {
    return DEFAULT_ASSET_PROFILE;
  }

  return {
    ownsTwoWheeler: Boolean(row.owns_two_wheeler),
    twoWheelerCount: row.two_wheeler_count ?? null,
    ownsFourWheeler: Boolean(row.owns_four_wheeler),
    fourWheelerCount: row.four_wheeler_count ?? null,
    ownsHouse: Boolean(row.owns_house),
    houseCount: row.house_count ?? null,
    houseType: row.house_type ?? null,
    ownsLand: Boolean(row.owns_land),
    landAreaAcres: row.land_area_acres !== null && row.land_area_acres !== undefined ? Number(row.land_area_acres) : null,
    landType: row.land_type ?? null,
    ownsAgriculturalEquipment: Boolean(row.owns_agricultural_equipment),
    agriculturalEquipmentDetails: row.agricultural_equipment_details ?? null,
    hasRefrigerator: Boolean(row.has_refrigerator),
    hasAirConditioner: Boolean(row.has_air_conditioner),
    ownsCommercialProperty: Boolean(row.owns_commercial_property),
    hasKisanCreditCard: Boolean(row.has_kisan_credit_card),
    kccCreditLimitInr: row.kcc_credit_limit_inr !== null && row.kcc_credit_limit_inr !== undefined ? Number(row.kcc_credit_limit_inr) : null,
  };
}

export async function saveAssetProfile(input: AssetProfileInput): Promise<ActionResult> {
  const parsed = assetProfileSchema.safeParse(input);
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

  const { error } = await supabase.from('citizen_asset_profiles').upsert(
    {
      citizen_id: citizenId,
      owns_two_wheeler: parsed.data.ownsTwoWheeler,
      two_wheeler_count: parsed.data.ownsTwoWheeler ? parsed.data.twoWheelerCount : null,
      owns_four_wheeler: parsed.data.ownsFourWheeler,
      four_wheeler_count: parsed.data.ownsFourWheeler ? parsed.data.fourWheelerCount : null,
      owns_house: parsed.data.ownsHouse,
      house_count: parsed.data.ownsHouse ? parsed.data.houseCount : null,
      house_type: parsed.data.houseType,
      owns_land: parsed.data.ownsLand,
      land_area_acres: parsed.data.ownsLand ? parsed.data.landAreaAcres : null,
      land_type: parsed.data.ownsLand ? parsed.data.landType : null,
      owns_agricultural_equipment: parsed.data.ownsAgriculturalEquipment,
      agricultural_equipment_details: parsed.data.ownsAgriculturalEquipment ? parsed.data.agriculturalEquipmentDetails : null,
      has_refrigerator: parsed.data.hasRefrigerator,
      has_air_conditioner: parsed.data.hasAirConditioner,
      owns_commercial_property: parsed.data.ownsCommercialProperty,
      has_kisan_credit_card: parsed.data.hasKisanCreditCard,
      kcc_credit_limit_inr: parsed.data.hasKisanCreditCard ? parsed.data.kccCreditLimitInr : null,
    },
    { onConflict: 'citizen_id' },
  );

  if (error) {
    console.error('saveAssetProfile failed', error.message || error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/dashboard');
  revalidatePath('/opportunities');
  revalidatePath('/profile/finance');
  return { ok: true };
}
