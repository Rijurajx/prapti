'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveCitizenId } from '@/app/profile/active-citizen';
import {
  commitConfirmedFacts,
  type ExtractedFacts,
} from '@/services/gemini';
import { executeRAGQuery, type RAGAnswerResult } from '@/services/rag';

export interface AssistantSuccessResult {
  ok: true;
  reply: string;
  facts?: ExtractedFacts | null;
  suggestedFollowUps?: string[];
  referencedSchemes?: Array<{
    name: string;
    slug: string;
    status: 'eligible' | 'needs_documents' | 'ineligible' | 'unknown';
    portalUrl?: string | null;
    benefit?: string | null;
  }>;
}

export type AssistantResult =
  | AssistantSuccessResult
  | { ok: false; error: string };

export type CommitResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Context-aware RAG Assistant: answers queries using the full profile,
 * documents inventory, and deterministic rule evaluation of the active citizen.
 */
export async function processAssistantMessage(
  userMessage: string,
  explicitCitizenId?: string,
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>,
): Promise<AssistantResult> {
  if (!userMessage || userMessage.trim().length === 0) {
    return { ok: false, error: 'Please enter a message' };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  // Resolve target citizen ID (verify ownership if explicit ID provided)
  let citizenId = explicitCitizenId;
  if (citizenId) {
    const { data: verified } = await supabase
      .from('citizen_profiles')
      .select('id')
      .eq('id', citizenId)
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!verified) {
      citizenId = await resolveActiveCitizenId(supabase, user.id) ?? undefined;
    }
  } else {
    citizenId = await resolveActiveCitizenId(supabase, user.id) ?? undefined;
  }

  if (!citizenId) {
    return { ok: false, error: 'Citizen profile not found' };
  }

  const ragResult = await executeRAGQuery({
    userMessage: userMessage.trim(),
    citizenId,
    supabase,
    conversationHistory,
  });

  return {
    ok: true,
    reply: ragResult.reply,
    facts: ragResult.facts,
    suggestedFollowUps: ragResult.suggestedFollowUps,
    referencedSchemes: ragResult.referencedSchemes,
  };
}

/**
 * Commits confirmed extracted facts into citizen profile tables.
 */
export async function confirmAndSaveFacts(
  facts: ExtractedFacts,
  explicitCitizenId?: string,
): Promise<CommitResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: 'Database not available' };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Please sign in first' };

  let citizenId = explicitCitizenId;
  if (citizenId) {
    const { data: verified } = await supabase
      .from('citizen_profiles')
      .select('id')
      .eq('id', citizenId)
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (!verified) {
      citizenId = await resolveActiveCitizenId(supabase, user.id) ?? undefined;
    }
  } else {
    citizenId = await resolveActiveCitizenId(supabase, user.id) ?? undefined;
  }

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
