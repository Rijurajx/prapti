import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/link-button';
import { getPersonalizedOpportunities } from '@/services/matching';
import { OpportunityCard } from './opportunity-card';

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'eligible' } = await searchParams;

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
    return (
      <StatusNotice tone="warning" title="Citizen profile not found">
        Please complete your basic profile setup.
      </StatusNotice>
    );
  }

  const opportunities = await getPersonalizedOpportunities(supabase, citizen.id);

  const eligibleCount = opportunities.likelyEligible.length;
  const needsInfoCount = opportunities.needsMoreInfo.length;
  const ineligibleCount = opportunities.likelyIneligible.length;

  let currentList = opportunities.likelyEligible;
  if (tab === 'needs_info') currentList = opportunities.needsMoreInfo;
  if (tab === 'ineligible') currentList = opportunities.likelyIneligible;
  if (tab === 'all') {
    currentList = [
      ...opportunities.likelyEligible,
      ...opportunities.needsMoreInfo,
      ...opportunities.likelyIneligible,
    ];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Opportunities"
        description="Government schemes assessed deterministically against your recorded personal circumstances and published scheme rules."
      />

      <StatusNotice tone="info" title="How eligibility assessment works">
        PRAPTI uses deterministic rule evaluation based on official government orders. Results are
        guidance (&quot;Likely eligible&quot;) to help you prepare documents, never a binding approval or entitlement.
      </StatusNotice>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/app/opportunities?tab=eligible"
          className={`block rounded-lg border p-4 transition-colors ${
            tab === 'eligible'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-foreground">Likely Eligible</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{eligibleCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Schemes where all rules passed</p>
        </Link>

        <Link
          href="/app/opportunities?tab=needs_info"
          className={`block rounded-lg border p-4 transition-colors ${
            tab === 'needs_info'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-foreground">Needs More Info</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{needsInfoCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Missing profile facts to evaluate</p>
        </Link>

        <Link
          href="/app/opportunities?tab=ineligible"
          className={`block rounded-lg border p-4 transition-colors ${
            tab === 'ineligible'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border bg-card hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Likely Ineligible</span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{ineligibleCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Published criteria not currently met</p>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-sm">
        <Link
          href="/app/opportunities?tab=eligible"
          className={`border-b-2 px-4 py-2 font-medium ${
            tab === 'eligible'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Likely Eligible ({eligibleCount})
        </Link>
        <Link
          href="/app/opportunities?tab=needs_info"
          className={`border-b-2 px-4 py-2 font-medium ${
            tab === 'needs_info'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Needs More Info ({needsInfoCount})
        </Link>
        <Link
          href="/app/opportunities?tab=ineligible"
          className={`border-b-2 px-4 py-2 font-medium ${
            tab === 'ineligible'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Likely Ineligible ({ineligibleCount})
        </Link>
        <Link
          href="/app/opportunities?tab=all"
          className={`border-b-2 px-4 py-2 font-medium ${
            tab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          All Opportunities ({opportunities.totalPublishedCount})
        </Link>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" aria-hidden />}
          title={
            tab === 'eligible'
              ? 'No likely eligible schemes found yet'
              : tab === 'needs_info'
              ? 'No schemes waiting for more information'
              : 'No schemes in this category'
          }
          description={
            tab === 'eligible'
              ? 'Complete more profile sections such as education, address, or agriculture to discover matching opportunities.'
              : 'PRAPTI has evaluated all published government schemes against your current details.'
          }
          action={
            <LinkButton variant="secondary" size="sm" href="/app/profile/personal">
              Update Profile Details
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-4">
          {currentList.map((opp) => (
            <OpportunityCard key={opp.schemeId} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
