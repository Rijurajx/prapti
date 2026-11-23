'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ACTIVE_CITIZEN_COOKIE } from '@/app/profile/active-citizen';
import type { ActionResult } from '@/app/profile/actions';
import type { Gender } from '@/lib/validation/profile';

export interface AddFamilyMemberInput {
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: Gender;
}

export async function switchActiveProfile(citizenId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database service is not configured.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };

  // Verify ownership or access
  const { data: profile, error } = await supabase
    .from('citizen_profiles')
    .select('id, display_name, relationship_to_owner')
    .eq('id', citizenId)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, error: 'You do not have access to that family member profile.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CITIZEN_COOKIE, citizenId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/dashboard');
  return { ok: true };
}

export async function addFamilyMember(
  input: AddFamilyMemberInput,
): Promise<{ ok: true; citizenId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database service is not configured.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };

  const name = input.name.trim();
  const relationship = input.relationship.trim();

  if (!name || name.length > 120) {
    return { ok: false, error: 'Please provide a valid full name (1 to 120 characters).' };
  }
  if (!relationship || relationship.length > 80) {
    return { ok: false, error: 'Please specify the relationship (e.g. Father, Mother, Aunt, Child).' };
  }

  const { data: newProfile, error: insertError } = await supabase
    .from('citizen_profiles')
    .insert({
      owner_user_id: user.id,
      display_name: name,
      relationship_to_owner: relationship,
    })
    .select('id')
    .single();

  if (insertError || !newProfile) {
    console.error('addFamilyMember failed', insertError);
    return { ok: false, error: 'Could not create family member. Please try again.' };
  }

  // If initial basic details were provided, insert into personal details
  if (input.dateOfBirth || input.gender) {
    await supabase.from('citizen_personal_details').insert({
      citizen_id: newProfile.id,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
    });
  }

  // Switch active profile to the newly registered family member
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_CITIZEN_COOKIE, newProfile.id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/dashboard');
  return { ok: true, citizenId: newProfile.id };
}

export async function removeFamilyMember(citizenId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database service is not configured.' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in again.' };

  // Never allow deleting the primary self account
  const { error } = await supabase
    .from('citizen_profiles')
    .delete()
    .eq('id', citizenId)
    .eq('owner_user_id', user.id)
    .neq('relationship_to_owner', 'self');

  if (error) {
    console.error('removeFamilyMember error', error);
    return { ok: false, error: 'Could not remove family member profile.' };
  }

  // If the removed member was currently selected, reset cookie back to self profile
  const cookieStore = await cookies();
  const currentCookie = cookieStore.get(ACTIVE_CITIZEN_COOKIE)?.value;
  if (currentCookie === citizenId) {
    const { data: selfProfile } = await supabase
      .from('citizen_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('relationship_to_owner', 'self')
      .maybeSingle();

    if (selfProfile) {
      cookieStore.set(ACTIVE_CITIZEN_COOKIE, selfProfile.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    } else {
      cookieStore.delete(ACTIVE_CITIZEN_COOKIE);
    }
  }

  revalidatePath('/dashboard');
  return { ok: true };
}
