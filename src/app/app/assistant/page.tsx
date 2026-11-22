import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { AssistantChat } from './assistant-chat';

export default async function AssistantPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Benefits Assistant"
        description="Describe your personal circumstances naturally in English or Bengali. PRAPTI understands your situation and helps map it to verified government scheme criteria."
      />

      <StatusNotice tone="info" title="Privacy and control guarantee">
        PRAPTI uses AI only to understand your natural language input. The AI never invents scheme rules,
        never decides eligibility, and will never save any extracted fact to your profile without your
        explicit confirmation.
      </StatusNotice>

      <AssistantChat />
    </div>
  );
}

