'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const CLAIM_STATUS_VALUES = [
  'not_started',
  'preparing_documents',
  'ready_to_apply',
  'submitted',
  'under_verification',
  'approved',
  'rejected',
  'withdrawn',
] as const;

export type ClaimStatus = (typeof CLAIM_STATUS_VALUES)[number];

export async function updateClaimStatus(
  claimId: string,
  newStatus: ClaimStatus,
  note?: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in' };

  // Fetch current claim to ensure user is owner and get from_status
  const { data: claim, error: fetchErr } = await supabase
    .from('claims')
    .select('id, status, citizen_id')
    .eq('id', claimId)
    .single();

  if (fetchErr || !claim) {
    return { ok: false, error: 'Claim not found' };
  }

  const fromStatus = claim.status;

  // Update claim
  const { error: updateErr } = await supabase
    .from('claims')
    .update({
      status: newStatus,
      submitted_on_user_report:
        newStatus === 'submitted' ? new Date().toISOString().slice(0, 10) : undefined,
    })
    .eq('id', claimId);

  if (updateErr) {
    return { ok: false, error: 'Failed to update claim status' };
  }

  // Record audit history event
  await supabase.from('claim_status_events').insert({
    claim_id: claimId,
    from_status: fromStatus,
    to_status: newStatus,
    actor_user_id: user.id,
    note: note ?? `Status updated to ${newStatus}`,
  });

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function toggleTaskDone(taskId: string, isDone: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in' };

  const { error } = await supabase
    .from('claim_tasks')
    .update({ is_done: isDone })
    .eq('id', taskId);

  if (error) {
    return { ok: false, error: 'Failed to update task' };
  }

  revalidatePath('/applications');
  return { ok: true };
}

export async function updateClaimNote(claimId: string, note: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in' };

  const { error } = await supabase
    .from('claims')
    .update({ reference_note: note.slice(0, 500) })
    .eq('id', claimId);

  if (error) {
    return { ok: false, error: 'Failed to save note' };
  }

  revalidatePath('/applications');
  return { ok: true };
}

