import { createSupabaseServerClient } from '@/lib/supabase/server';
import { tokenSchema } from '@/lib/validation/household';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InviteDecisionButtons } from '../household-forms';

export default async function HouseholdInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const parsed = tokenSchema.safeParse({ token: token ?? '' });

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        <PageHeader title="Household invitation" />
        <StatusNotice tone="warning" title="This invitation link is not valid">
          <p>Check the link you were sent, or ask the person who invited you to send it again.</p>
        </StatusNotice>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-6">
      <PageHeader
        title="Household invitation"
        description="Someone has invited you to join their household on Prapti."
      />

      <Card>
        <CardHeader>
          <CardTitle>Join this household?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you accept, the household can see only the sharing you choose to set up. You can stop
            sharing at any time.
          </p>
          {user ? (
            <InviteDecisionButtons token={parsed.data.token} />
          ) : (
            <StatusNotice tone="info" title="Sign in to respond">
              <p>You need to sign in before you can accept or decline this invitation.</p>
              <div className="mt-3">
                <LinkButton href="/sign-in" variant="secondary" size="sm">
                  Sign in
                </LinkButton>
              </div>
            </StatusNotice>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
