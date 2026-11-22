'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  extractFactsWithGemini,
  commitConfirmedFacts,
  type ExtractedFacts,
} from '@/services/gemini';

export type AssistantResult =
  | { ok: true; facts: ExtractedFacts }
  | { ok: false; error: string };

export type CommitResult =
  | { ok: true }
  | { ok: false; error: string };

export async function processAssistantMessage(userMessage: string): Promise<AssistantResult> {
  if (!userMessage || userMessage.trim().length === 0) {
    return { ok: false, error: 'Please enter a message' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  const facts = await extractFactsWithGemini(userMessage.trim());
  return { ok: true, facts };
}

export async function confirmAndSaveFacts(facts: ExtractedFacts): Promise<CommitResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  const { data: citizen } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (!citizen) return { ok: false, error: 'Citizen profile not found' };

  const res = await commitConfirmedFacts(supabase, citizen.id, facts);
  if (res.ok) {
    revalidatePath('/app/dashboard');
    revalidatePath('/app/opportunities');
    revalidatePath('/app/profile/personal');
    revalidatePath('/app/profile/address');
    revalidatePath('/app/profile/finance');
    revalidatePath('/app/profile/education');
    return { ok: true };
  }
  return { ok: false, error: res.error };
}
