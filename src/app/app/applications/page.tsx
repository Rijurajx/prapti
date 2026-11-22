import { redirect } from 'next/navigation';
import { Clock, BookOpen } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/link-button';
import { ClaimCard } from './claim-card';

export default async function ApplicationsPage() {
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

  const { data: claimsData } = await supabase
    .from('claims')
    .select(`
      id,
      status,
      reference_note,
      submitted_on_user_report,
      created_at,
      schemes (
        id,
        slug,
        name,
        name_bn,
        portal_url,
        category,
        jurisdiction
      ),
      claim_tasks (
        id,
        step_order,
        title,
        description,
        is_done
      ),
      claim_status_events (
        id,
        from_status,
        to_status,
        note,
        occurred_at
      )
    `)
    .eq('citizen_id', citizen.id)
    .order('created_at', { ascending: false });

  const claims = (claimsData ?? []) as any[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Applications"
        description="Track the real-world progress of your benefit applications, manage document preparation checklists, and keep your application notes in one place."
      />

      <StatusNotice tone="info" title="User-managed application tracking">
        PRAPTI helps you prepare and track applications. Because government portals do not offer open
        application APIs, statuses here are user-reported. PRAPTI never claims to submit government
        applications on your behalf.
      </StatusNotice>

      {claims.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-6 w-6" aria-hidden />}
          title="No applications tracked yet"
          description="When you find a scheme you want to apply for in My Opportunities or the Scheme Directory, click &quot;Track Application&quot; to manage your checklist here."
          action={
            <LinkButton size="sm" href="/app/opportunities">
              Find Opportunities
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      )}
    </div>
  );
}

