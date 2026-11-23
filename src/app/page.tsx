import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HomeClientView } from './home-client-view';

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes('-auth-token'));

  let user = null;
  if (hasAuthCookie) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }
  }

  return <HomeClientView user={user} />;
}
