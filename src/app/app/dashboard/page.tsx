import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderLock,
  ArrowRight,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';
import { getPersonalizedOpportunities } from '@/services/matching';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [userProfileRes, citizenRes] = await Promise.all([
    supabase.from('user_profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('citizen_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('relationship_to_owner', 'self')
      .maybeSingle(),
  ]);

  if (userProfileRes.error || !citizenRes.data) {
    return (
      <StatusNotice tone="danger" title="We could not load your dashboard">
        Please refresh the page. If this continues, sign out and sign in again.
      </StatusNotice>
    );
  }

  const citizenId = citizenRes.data.id;
  const firstName = userProfileRes.data?.full_name?.split(' ')[0] ?? 'there';

  // Fetch opportunities, claims, documents, and profile completeness in parallel
  const [opportunities, claimsRes, docsRes, personalRes, addressRes, financeRes] =
    await Promise.all([
      getPersonalizedOpportunities(supabase, citizenId),
      supabase.from('claims').select('id, status').eq('citizen_id', citizenId),
      supabase
        .from('citizen_document_inventory')
        .select('id, status')
        .eq('citizen_id', citizenId),
      supabase
        .from('citizen_personal_details')
        .select('date_of_birth, gender')
        .eq('citizen_id', citizenId)
        .maybeSingle(),
      supabase
        .from('citizen_addresses')
        .select('state, district')
        .eq('citizen_id', citizenId)
        .maybeSingle(),
      supabase
        .from('citizen_financial_profiles')
        .select('family_annual_income_inr, income_range')
        .eq('citizen_id', citizenId)
        .maybeSingle(),
    ]);

  const eligibleCount = opportunities.likelyEligible.length;
  const needsInfoCount = opportunities.needsMoreInfo.length;
  const claimsCount = claimsRes.data?.length ?? 0;

  const totalDocsRecorded = docsRes.data?.length ?? 0;
  const readyDocs = docsRes.data?.filter((d: any) => d.status === 'available').length ?? 0;

  // Meaningful Profile Completeness
  const hasPersonal = Boolean(personalRes.data?.date_of_birth && personalRes.data?.gender);
  const hasAddress = Boolean(addressRes.data?.state && addressRes.data?.district);
  const hasFinance = Boolean(
    financeRes.data?.family_annual_income_inr !== null || financeRes.data?.income_range !== null,
  );
  const hasDocs = totalDocsRecorded > 0;

  const completenessSteps = [
    { label: 'Basic details (DOB, Gender)', complete: hasPersonal, href: '/app/profile/personal' },
    { label: 'Address & Domicile', complete: hasAddress, href: '/app/profile/address' },
    { label: 'Family Income', complete: hasFinance, href: '/app/profile/finance' },
    { label: 'Document Inventory', complete: hasDocs, href: '/app/profile/documents' },
  ];
  const completedStepsCount = completenessSteps.filter((s) => s.complete).length;
  const isProfileStrong = completedStepsCount >= 3;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Your personal citizen benefits workspace. PRAPTI evaluates official government schemes against your profile to guide your claims."
      />

      {eligibleCount > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-semibold">
                  You have {eligibleCount} likely eligible{' '}
                  {eligibleCount === 1 ? 'opportunity' : 'opportunities'}!
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  Based on verified scheme rules and your recorded circumstances.
                </p>
              </div>
            </div>
            <LinkButton size="sm" href="/app/opportunities?tab=eligible">
              View Eligible Schemes <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </LinkButton>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Opportunities Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opportunities</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eligibleCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {needsInfoCount > 0 ? `+${needsInfoCount} need more info` : 'Likely eligible schemes'}
            </p>
            <div className="mt-3">
              <LinkButton variant="secondary" size="sm" href="/app/opportunities">
                Open Opportunities
              </LinkButton>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completeness Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedStepsCount} of {completenessSteps.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isProfileStrong ? 'Profile ready for matching' : 'Add details for better matching'}
            </p>
            <div className="mt-3">
              <LinkButton variant="secondary" size="sm" href="/app/profile/personal">
                Update Profile
              </LinkButton>
            </div>
          </CardContent>
        </Card>

        {/* Document Readiness Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
              <FolderLock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyDocs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalDocsRecorded > 0
                ? `${readyDocs} ready of ${totalDocsRecorded} recorded`
                : 'No documents recorded yet'}
            </p>
            <div className="mt-3">
              <LinkButton variant="secondary" size="sm" href="/app/profile/documents">
                Document Inventory
              </LinkButton>
            </div>
          </CardContent>
        </Card>

        {/* Applications Tracking Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Applications</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claimsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {claimsCount === 0 ? 'No active claims tracked' : 'Claims in progress'}
            </p>
            <div className="mt-3">
              <LinkButton variant="secondary" size="sm" href="/app/applications">
                View Applications
              </LinkButton>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Checklist & Recommended Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Completeness</CardTitle>
            <CardDescription>
              Adding your real circumstances helps the deterministic engine evaluate all rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border/60">
              {completenessSteps.map((step) => (
                <div key={step.label} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {step.complete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={step.complete ? 'text-foreground' : 'text-muted-foreground font-medium'}>
                      {step.label}
                    </span>
                  </div>
                  <Link
                    href={step.href}
                    className="font-medium text-primary hover:underline"
                  >
                    {step.complete ? 'Edit' : 'Add'}
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Household Management</CardTitle>
            <CardDescription>
              Manage benefits across your family while preserving individual privacy and consent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a household to invite family members or manage minor dependants. Each family member
              has an independent profile and control over their own data.
            </p>
            <div>
              <LinkButton variant="secondary" size="sm" href="/app/household">
                <Users className="mr-1.5 h-3.5 w-3.5" /> Open Household Workspace
              </LinkButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
