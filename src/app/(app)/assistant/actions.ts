'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveCitizenId } from '@/app/profile/active-citizen';
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

  const citizenId = await resolveActiveCitizenId(supabase, user.id);
  if (!citizenId) return { ok: false, error: 'Citizen profile not found' };

  const res = await commitConfirmedFacts(supabase, citizenId, facts);
  if (res.ok) {
    revalidatePath('/dashboard');
    revalidatePath('/opportunities');
    revalidatePath('/profile/personal');
    revalidatePath('/profile/address');
    revalidatePath('/profile/finance');
    revalidatePath('/profile/education');
    return { ok: true };
  }
  return { ok: false, error: res.error };
}
