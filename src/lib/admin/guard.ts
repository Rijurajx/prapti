import { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdministratorResult = { ok: true; userId: string } | { ok: false; error: string };

const GENERIC_ERROR = 'Something went wrong. Please try again.';

/**
 * Confirms the signed-in user holds the administrator role.
 * The user id comes from the verified session only, never from client input.
 */
export async function requireAdministrator(): Promise<AdministratorResult> {
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

  const { data, error } = await supabase.rpc('is_administrator');
  if (error) {
    console.error('requireAdministrator failed', error.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (data !== true) {
    return { ok: false, error: 'Administrator access is required' };
  }

  return { ok: true, userId: user.id };
}
