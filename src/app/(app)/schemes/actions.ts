'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveCitizenId } from '@/app/profile/active-citizen';

export type ActionResult = { ok: true; isSaved?: boolean; isEnrolled?: boolean } | { ok: false; error: string };

async function resolveCitizen(supabase: any, userId: string): Promise<string | null> {
  return resolveActiveCitizenId(supabase, userId);
}

export async function toggleEnrollScheme(schemeId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  const citizenId = await resolveCitizen(supabase, user.id);
  if (!citizenId) return { ok: false, error: 'Citizen profile not found' };

  // Check if currently enrolled
  const { data: existing } = await supabase
    .from('citizen_enrolled_schemes')
    .select('id')
    .eq('citizen_id', citizenId)
    .eq('scheme_id', schemeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('citizen_enrolled_schemes')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, error: 'Could not remove enrolled scheme' };

    revalidatePath('/dashboard');
    revalidatePath('/schemes');
    revalidatePath('/opportunities');
    return { ok: true, isEnrolled: false };
  } else {
    const { error } = await supabase
      .from('citizen_enrolled_schemes')
      .insert({ citizen_id: citizenId, scheme_id: schemeId });
    if (error) return { ok: false, error: 'Could not mark scheme as enrolled' };

    revalidatePath('/dashboard');
    revalidatePath('/schemes');
    revalidatePath('/opportunities');
    return { ok: true, isEnrolled: true };
  }
}

export async function toggleSaveScheme(schemeId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  const citizenId = await resolveCitizen(supabase, user.id);
  if (!citizenId) return { ok: false, error: 'Citizen profile not found' };

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_schemes')
    .select('id')
    .eq('citizen_id', citizenId)
    .eq('scheme_id', schemeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('saved_schemes')
      .delete()
      .eq('id', existing.id);
    if (error) return { ok: false, error: 'Could not remove saved scheme' };
    revalidatePath('/schemes');
    revalidatePath('/saved');
    revalidatePath('/opportunities');
    return { ok: true, isSaved: false };
  } else {
    const { error } = await supabase
      .from('saved_schemes')
      .insert({ citizen_id: citizenId, scheme_id: schemeId });
    if (error) return { ok: false, error: 'Could not save scheme' };
    revalidatePath('/schemes');
    revalidatePath('/saved');
    revalidatePath('/opportunities');
    return { ok: true, isSaved: true };
  }
}

export async function startApplicationClaim(schemeId: string, schemeVersionId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  const citizenId = await resolveCitizen(supabase, user.id);
  if (!citizenId) return { ok: false, error: 'Citizen profile not found' };

  // Check if claim already exists
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('id')
    .eq('citizen_id', citizenId)
    .eq('scheme_id', schemeId)
    .maybeSingle();

  if (existingClaim) {
    return { ok: true };
  }

  // Create claim
  const { data: claim, error: claimErr } = await supabase
    .from('claims')
    .insert({
      citizen_id: citizenId,
      scheme_id: schemeId,
      scheme_version_id: schemeVersionId,
      status: 'preparing_documents',
    })
    .select('id')
    .single();

  if (claimErr || !claim) {
    return { ok: false, error: 'Failed to create application tracker' };
  }

  // Record initial status event
  await supabase.from('claim_status_events').insert({
    claim_id: claim.id,
    from_status: null,
    to_status: 'preparing_documents',
    actor_user_id: user.id,
    note: 'Started preparing documents via PRAPTI',
  });

  // Populate tasks from scheme application steps
  const { data: steps } = await supabase
    .from('scheme_application_steps')
    .select('step_order, title_en, body_en')
    .eq('scheme_version_id', schemeVersionId)
    .order('step_order', { ascending: true });

  if (steps && steps.length > 0) {
    const tasks = steps.map((s: any) => ({
      claim_id: claim.id,
      step_order: s.step_order,
      title: s.title_en,
      description: s.body_en,
      is_done: false,
    }));
    await supabase.from('claim_tasks').insert(tasks);
  }

  revalidatePath('/applications');
  revalidatePath('/opportunities');
  revalidatePath('/dashboard');
  return { ok: true };
}

