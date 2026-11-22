'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const reminderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  dueAt: z.string().min(1, 'Due date is required'),
  kind: z.enum(['deadline', 'follow_up', 'renewal', 'task']).default('task'),
});

async function resolveCitizen(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();
  return data?.id ?? null;
}

export async function createReminder(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in' };

  const citizenId = await resolveCitizen(supabase, user.id);
  if (!citizenId) return { ok: false, error: 'Citizen profile not found' };

  const parsed = reminderSchema.safeParse({
    title: formData.get('title'),
    dueAt: formData.get('dueAt'),
    kind: formData.get('kind') ?? 'task',
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { error } = await supabase.from('reminders').insert({
    citizen_id: citizenId,
    title: parsed.data.title,
    due_at: new Date(parsed.data.dueAt).toISOString(),
    kind: parsed.data.kind,
  });

  if (error) {
    return { ok: false, error: 'Failed to create reminder' };
  }

  revalidatePath('/app/reminders');
  return { ok: true };
}

export async function toggleReminderDismissed(reminderId: string, isDismissed: boolean): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { error } = await supabase
    .from('reminders')
    .update({ is_dismissed: isDismissed })
    .eq('id', reminderId);

  if (error) {
    return { ok: false, error: 'Failed to update reminder' };
  }

  revalidatePath('/app/reminders');
  return { ok: true };
}

export async function deleteReminder(reminderId: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
  if (error) {
    return { ok: false, error: 'Failed to delete reminder' };
  }

  revalidatePath('/app/reminders');
  return { ok: true };
}

