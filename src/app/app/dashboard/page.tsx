import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return (
      <StatusNotice tone="danger" title="We could not load your dashboard">
        Please refresh the page. If this continues, sign out and sign in again.
      </StatusNotice>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const hasFullName = typeof profile?.full_name === 'string' && profile.full_name.trim().length > 0;
  const basicStepsDone = 1 + (hasFullName ? 1 : 0);
  const basicStepsTotal = 2;
  const basicComplete = basicStepsDone === basicStepsTotal;

  return (
    <div>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Your personal benefits overview. Nothing here is a decision about your eligibility."
      />
      <StatusNotice tone="info" title="No scheme results yet">
        PRAPTI shows scheme matches only after scheme rules are reviewed against official sources. No scheme has been published in this app yet.
      </StatusNotice>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic details</CardTitle>
            <CardDescription>
              {basicComplete
                ? 'Basic details complete.'
                : `${basicStepsDone} of ${basicStepsTotal} basic steps done.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={basicComplete ? 'success' : 'neutral'}>
                {basicComplete ? 'Complete' : 'In progress'}
              </Badge>
              <LinkButton variant="secondary" size="sm" href="/app/profile/personal">
                Open personal details
              </LinkButton>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
            <CardDescription>
              Likely eligible, needs information, and likely ineligible results appear here once published schemes are checked against your details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="neutral">No results yet</Badge>
              <LinkButton variant="ghost" size="sm" href="/app/opportunities">
                Open opportunities
              </LinkButton>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Record which documents you have. Identity numbers are never requested.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton variant="secondary" size="sm" href="/app/profile/documents">
              Open document inventory
            </LinkButton>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              Applications you track appear here. PRAPTI does not submit applications for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton variant="secondary" size="sm" href="/app/applications">
              Open my applications
            </LinkButton>
          </CardContent>
        </Card>
      </div>
      <h2 className="mt-8 mb-3 text-base font-semibold">Household</h2>
      <p className="text-sm text-muted-foreground">
        Household members appear here once household management is available.
      </p>
      <div className="mt-3">
        <LinkButton variant="ghost" size="sm" href="/app/household">
          Open household
        </LinkButton>
      </div>
    </div>
  );
}
