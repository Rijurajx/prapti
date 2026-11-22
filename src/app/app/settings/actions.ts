'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updateUserSettings(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const fullName = formData.get('fullName')?.toString().trim();
  const language = formData.get('language')?.toString();

  if (!fullName) return;

  await supabase
    .from('user_profiles')
    .update({
      full_name: fullName,
      preferred_language: language === 'bn' ? 'bn' : 'en',
    })
    .eq('id', user.id);

  revalidatePath('/app/settings');
  revalidatePath('/app/dashboard');
}
