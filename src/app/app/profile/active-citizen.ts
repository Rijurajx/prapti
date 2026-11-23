import { cookies } from 'next/headers';
import type { createSupabaseServerClient } from '@/lib/supabase/server';

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export const ACTIVE_CITIZEN_COOKIE = 'prapti_active_citizen_id';

/**
 * Resolves the active citizen profile ID for the signed-in user.
 * 1. Checks the 'prapti_active_citizen_id' cookie.
 * 2. If valid and owned by the user, returns that citizen profile ID.
 * 3. Otherwise defaults to the user's primary 'self' citizen profile.
 */
export async function resolveActiveCitizenId(
  supabase: ServerClient,
  userId: string,
): Promise<string | null> {
  let requestedId: string | null = null;
  try {
    const cookieStore = await cookies();
    requestedId = cookieStore.get(ACTIVE_CITIZEN_COOKIE)?.value ?? null;
  } catch {
    // If cookies() cannot be read (e.g. static rendering), fallback gracefully
  }

  if (requestedId) {
    const { data: requestedProfile } = await supabase
      .from('citizen_profiles')
      .select('id')
      .eq('id', requestedId)
      .eq('owner_user_id', userId)
      .maybeSingle();

    if (requestedProfile) {
      return requestedProfile.id;
    }
  }

  // Fallback to self profile
  const { data: selfProfile, error } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (error) {
    console.error('resolveActiveCitizenId failed', error.code);
    return null;
  }

  if (selfProfile) {
    return selfProfile.id;
  }

  // Fallback to any profile owned by user
  const { data: anyProfile } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', userId)
    .limit(1)
    .maybeSingle();

  return anyProfile?.id ?? null;
}
