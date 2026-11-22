import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { RemindersView } from './reminders-view';

export default async function RemindersPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: citizen } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (!citizen) {
    return redirect('/app/dashboard');
  }

  const { data: reminders } = await supabase
    .from('reminders')
    .select('*')
    .eq('citizen_id', citizen.id)
    .order('due_at', { ascending: true });

  const list = (reminders ?? []) as any[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        description="Persistent reminders for official government scheme deadlines, document preparation tasks, and application follow-ups."
      />

      <RemindersView reminders={list} />
    </div>
  );
}

