import { getFinancialProfile } from '@/app/app/profile/records-actions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { FinanceForm } from './finance-form';

export default async function FinancePage() {
  const profile = await getFinancialProfile();

  return (
    <div>
      <PageHeader
        title="Income and finance"
        description="Schemes define income differently: some use your own income, others use the whole family's. Enter what you know and leave the rest blank."
      />

      {profile ? (
        <FinanceForm initial={profile} />
      ) : (
        <StatusNotice tone="warning" title="We could not load your details">
          <p>Sign in again to continue.</p>
          <div className="mt-3">
            <LinkButton href="/auth/sign-in" variant="secondary" size="sm">
              Sign in
            </LinkButton>
          </div>
        </StatusNotice>
      )}
    </div>
  );
}
