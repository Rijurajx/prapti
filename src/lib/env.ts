// Client-safe environment access. Only NEXT_PUBLIC_* values may be read here.
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function isSupabaseConfigured(): boolean {
  return (
    typeof publicEnv.supabaseUrl === 'string' &&
    publicEnv.supabaseUrl.length > 0 &&
    typeof publicEnv.supabaseAnonKey === 'string' &&
    publicEnv.supabaseAnonKey.length > 0
  );
}
