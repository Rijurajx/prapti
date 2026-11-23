'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ADDRESS_KIND_VALUES,
  addressSchema,
  personalDetailsSchema,
  type Address,
  type AddressInput,
  type AddressKind,
  type AreaType,
  type Gender,
  type MaritalStatus,
  type PersonalDetails,
  type PersonalDetailsInput,
} from '@/lib/validation/profile';

import { resolveActiveCitizenId } from './active-citizen';

export type ActionResult = { ok: true } | { ok: false; error: string };

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

type SessionContext =
  | { ok: true; supabase: ServerClient; citizenId: string }
  | { ok: false; error: string };

type AddressRow = {
  kind: string;
  state: string | null;
  district: string | null;
  village_or_town: string | null;
  area_type: AreaType | null;
  pin_code: string | null;
  domicile_confirmed: boolean | null;
};

type PersonalDetailsRow = {
  date_of_birth: string | null;
  gender: Gender | null;
  marital_status: MaritalStatus | null;
};

const SAVE_ERROR_MESSAGE = 'We could not save your details. Please try again.';

function isAddressKind(value: string): value is AddressKind {
  return (ADDRESS_KIND_VALUES as readonly string[]).includes(value);
}

/** Resolves the active citizen id from the signed-in user or active cookie. Never trusts the client. */
async function findCitizenId(supabase: ServerClient, userId: string): Promise<string | null> {
  return resolveActiveCitizenId(supabase, userId);
}

async function resolveSession(): Promise<SessionContext> {
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

  const citizenId = await findCitizenId(supabase, user.id);
  if (!citizenId) {
    return {
      ok: false,
      error: 'Your profile could not be found. Try signing out and in again.',
    };
  }

  return { ok: true, supabase, citizenId };
}

export async function getOwnCitizenId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  return findCitizenId(supabase, user.id);
}

export async function getPersonalDetails(): Promise<PersonalDetails | null> {
  const supabase = await createSupabaseServerClient();
  const citizenId = await getOwnCitizenId();
  if (!supabase || !citizenId) {
    return null;
  }

  const { data, error } = await supabase
    .from('citizen_personal_details')
    .select('date_of_birth, gender, marital_status')
    .eq('citizen_id', citizenId)
    .maybeSingle();

  if (error) {
    console.error('getPersonalDetails failed', error.code);
    return null;
  }

  const row = data as PersonalDetailsRow | null;
  return {
    dateOfBirth: row?.date_of_birth ?? null,
    gender: row?.gender ?? null,
    maritalStatus: row?.marital_status ?? null,
  };
}

export async function getAddresses(): Promise<Record<'current' | 'permanent', Address | null>> {
  const result: Record<'current' | 'permanent', Address | null> = {
    current: null,
    permanent: null,
  };

  const supabase = await createSupabaseServerClient();
  const citizenId = await getOwnCitizenId();
  if (!supabase || !citizenId) {
    return result;
  }

  const { data, error } = await supabase
    .from('citizen_addresses')
    .select('kind, state, district, village_or_town, area_type, pin_code, domicile_confirmed')
    .eq('citizen_id', citizenId);

  if (error) {
    console.error('getAddresses failed', error.code);
    return result;
  }

  for (const row of (data ?? []) as AddressRow[]) {
    if (!isAddressKind(row.kind)) {
      continue;
    }
    result[row.kind] = {
      kind: row.kind,
      state: row.state,
      district: row.district,
      villageOrTown: row.village_or_town,
      areaType: row.area_type,
      pinCode: row.pin_code,
      domicileConfirmed: row.domicile_confirmed,
    };
  }

  return result;
}

export async function savePersonalDetails(input: PersonalDetailsInput): Promise<ActionResult> {
  const parsed = personalDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase.from('citizen_personal_details').upsert(
    {
      citizen_id: session.citizenId,
      date_of_birth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      marital_status: parsed.data.maritalStatus,
    },
    { onConflict: 'citizen_id' },
  );

  if (error) {
    console.error('savePersonalDetails failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/app/profile/personal');
  return { ok: true };
}

export async function saveAddress(input: AddressInput): Promise<ActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the address and try again' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase.from('citizen_addresses').upsert(
    {
      citizen_id: session.citizenId,
      kind: parsed.data.kind,
      state: parsed.data.state,
      district: parsed.data.district,
      village_or_town: parsed.data.villageOrTown,
      area_type: parsed.data.areaType,
      pin_code: parsed.data.pinCode,
      domicile_confirmed: parsed.data.domicileConfirmed,
    },
    { onConflict: 'citizen_id,kind' },
  );

  if (error) {
    console.error('saveAddress failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/app/profile/address');
  return { ok: true };
}

export async function deleteAddress(kind: 'current' | 'permanent'): Promise<ActionResult> {
  if (typeof kind !== 'string' || !isAddressKind(kind)) {
    return { ok: false, error: 'Unknown address type' };
  }

  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const { error } = await session.supabase
    .from('citizen_addresses')
    .delete()
    .eq('citizen_id', session.citizenId)
    .eq('kind', kind);

  if (error) {
    console.error('deleteAddress failed', error.code);
    return { ok: false, error: SAVE_ERROR_MESSAGE };
  }

  revalidatePath('/app/profile/address');
  return { ok: true };
}

export async function updateCategoryTags(tags: string[]): Promise<ActionResult> {
  const session = await resolveSession();
  if (!session.ok) {
    return session;
  }

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter((t) => t.length > 0 && t.length <= 50)
    : [];

  const { error } = await session.supabase
    .from('citizen_profiles')
    .update({ category_tags: cleanTags })
    .eq('id', session.citizenId);

  if (error) {
    console.error('updateCategoryTags failed', error.code);
    return { ok: false, error: 'Could not update category tags' };
  }

  revalidatePath('/app/dashboard');
  revalidatePath('/app/opportunities');
  revalidatePath('/app/profile/personal');
  return { ok: true };
}
