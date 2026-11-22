import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured, publicEnv } from '@/lib/env';

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(
    publicEnv.supabaseUrl as string,
    publicEnv.supabaseAnonKey as string,
  );
}
