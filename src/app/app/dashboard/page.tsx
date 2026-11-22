import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPersonalizedOpportunities } from '@/services/matching';
import { getPersonalDetails, getAddresses } from '@/app/app/profile/actions';
import {
  getFinancialProfile,
  getEmploymentProfile,
  listEducationRecords,
  getDocumentTypes,
  getDocumentStatuses,
} from '@/app/app/profile/records-actions';
import { getAgriculturalProfile } from '@/app/app/profile/agriculture-actions';
import { getMyHouseholds } from '@/app/app/household/queries';
import { DashboardWorkspace } from './dashboard-workspace';
import { DOCUMENT_STATUS_VALUES } from '@/lib/validation/finance-education-documents';
import type { DocumentRow } from '@/app/app/profile/documents/documents-form';
import { StatusNotice } from '@/components/ui/status-notice';

type DocumentStatusValue = (typeof DOCUMENT_STATUS_VALUES)[number];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'overview' } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const [userProfileRes, citizenRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, preferred_language')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('citizen_profiles')
      .select('id')
      .eq('owner_user_id', user.id)
      .eq('relationship_to_owner', 'self')
      .maybeSingle(),
  ]);

  if (!citizenRes.data) {
    return (
      <div className="p-8">
        <StatusNotice tone="danger" title="We could not load your citizen profile">
          Please refresh the page. If this continues, sign out and sign in again.
        </StatusNotice>
      </div>
    );
  }

  const citizenId = citizenRes.data.id;

  // Parallel fetch of all citizen datasets for the single-page application workspace
  const [
    opportunities,
    schemesRes,
    savedSchemesRes,
    claimsRes,
    remindersRes,
    personalDetails,
    addresses,
    financialProfile,
    employmentProfile,
    educationRecords,
    agriculturalProfile,
    docTypes,
    docStatuses,
    households,
  ] = await Promise.all([
    getPersonalizedOpportunities(supabase, citizenId),
    supabase
      .from('schemes')
      .select(`
        id,
        slug,
        name,
        name_bn,
        ministry_label,
        category,
        jurisdiction,
        state,
        portal_url,
        short_description,
        scheme_versions!schemes_current_version_fk (
          id,
          version_number,
          benefit_summary_en
        )
      `)
      .eq('status', 'published')
      .not('current_version_id', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('saved_schemes')
      .select('id, scheme_id, schemes (id, name, short_description)')
      .eq('citizen_id', citizenId),
    supabase
      .from('claims')
      .select(`
        id,
        scheme_id,
        status,
        official_application_id,
        citizen_notes,
        created_at,
        updated_at,
        schemes (id, name, portal_url),
        claim_tasks (id, task_title, is_completed, sort_order)
      `)
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false }),
    supabase
      .from('reminders')
      .select('*')
      .eq('citizen_id', citizenId)
      .order('due_date', { ascending: true }),
    getPersonalDetails(),
    getAddresses(),
    getFinancialProfile(),
    getEmploymentProfile(),
    listEducationRecords(),
    getAgriculturalProfile(),
    getDocumentTypes(),
    getDocumentStatuses(),
    getMyHouseholds(),
  ]);

  // Construct document rows for the inventory form
  const documentRows: DocumentRow[] = (docTypes ?? []).map((t) => {
    const saved = docStatuses[t.code];
    const rawStatus = saved?.status;
    const status: DocumentStatusValue | null =
      DOCUMENT_STATUS_VALUES.find((value) => value === rawStatus) ?? null;

    return {
      code: t.code,
      name: t.name,
      category: t.category,
      isSensitive: t.isSensitive,
      description: t.description,
      status,
      note: saved?.note ?? null,
    };
  });

  return (
    <DashboardWorkspace
      user={{
        id: user.id,
        email: user.email,
        full_name: userProfileRes.data?.full_name ?? undefined,
        preferred_language: userProfileRes.data?.preferred_language ?? 'en',
      }}
      citizenId={citizenId}
      initialTab={tab}
      opportunities={opportunities}
      schemes={schemesRes.data ?? []}
      savedSchemes={savedSchemesRes.data ?? []}
      claims={claimsRes.data ?? []}
      reminders={remindersRes.data ?? []}
      personalDetails={personalDetails}
      addresses={addresses}
      financialProfile={financialProfile}
      employmentProfile={employmentProfile}
      educationRecords={educationRecords ?? []}
      agriculturalProfile={agriculturalProfile}
      documentRows={documentRows}
      households={households ?? []}
    />
  );
}
