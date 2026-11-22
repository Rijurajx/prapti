import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMyHouseholds } from './queries';
import { CreateHouseholdForm } from './household-forms';

export default async function HouseholdPage() {
  const households = await getMyHouseholds();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Household"
        description="Share your profile with the people in your household, and only as far as you choose."
      />

      {households.length === 0 ? (
        <StatusNotice tone="info" title="You are not in a household yet">
          <p>Create a household below, then invite the people you live with.</p>
        </StatusNotice>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your households</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {households.map((household) => (
                <li key={household.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">{household.name}</span>
                  <div className="flex items-center gap-3">
                    {household.createdByMe && (
                      <span className="text-xs text-muted-foreground">You created this</span>
                    )}
                    <LinkButton href={`/app/household/${household.id}`} variant="secondary" size="sm">
                      Open
                    </LinkButton>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <CreateHouseholdForm />
    </div>
  );
}
