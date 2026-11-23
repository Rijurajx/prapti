import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Relationship } from '@/lib/validation/household';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHousehold, getMyConsents } from '../queries';
import {
  ConsentForm,
  InviteMemberForm,
  RemoveMemberButton,
  RevokeConsentButton,
} from '../household-forms';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  self: 'You',
  spouse: 'Spouse or partner',
  child: 'Child',
  parent: 'Parent',
  sibling: 'Sibling',
  other: 'Other family member',
};

const SCOPE_LABELS: Record<string, string> = {
  household_membership: 'Household membership',
  profile_read: 'Can view your profile',
  profile_edit: 'Can view and change your profile',
};

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  if (!UUID_PATTERN.test(householdId)) {
    notFound();
  }

  const household = await getHousehold(householdId);
  if (!household) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const isCreator = user !== null && household.createdByUserId === user.id;

  const consents = await getMyConsents(householdId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <Link
          href="/dashboard?tab=household"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider"
        >
          ← Return to Household Workspace
        </Link>
      </div>
      <PageHeader title={household.name} description="Who is in this household, and what you share." />

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {household.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{RELATIONSHIP_LABELS[member.relationship]}</p>
                  <p className="text-xs text-muted-foreground">
                    {member.status === 'active' ? 'Active' : 'Removed'}
                  </p>
                </div>
                {isCreator && member.status === 'active' && member.relationship !== 'self' && (
                  <RemoveMemberButton membershipId={member.id} />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isCreator && <InviteMemberForm householdId={household.id} />}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Your sharing</h2>
        {consents ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>What you have shared</CardTitle>
              </CardHeader>
              <CardContent>
                {consents.consents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You have not shared your profile yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {consents.consents.map((consent) => (
                      <li key={consent.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-medium">{SCOPE_LABELS[consent.scope] ?? 'Shared'}</p>
                          <p className="text-xs text-muted-foreground">
                            Shared on {formatDate(consent.grantedAt)}
                            {consent.revokedAt ? ` · Stopped on ${formatDate(consent.revokedAt)}` : ''}
                          </p>
                        </div>
                        {consent.revokedAt === null && <RevokeConsentButton consentId={consent.id} />}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <ConsentForm />
          </>
        ) : (
          <StatusNotice tone="warning" title="We could not load your sharing settings">
            <p>Try again in a moment.</p>
          </StatusNotice>
        )}
      </section>
    </div>
  );
}
