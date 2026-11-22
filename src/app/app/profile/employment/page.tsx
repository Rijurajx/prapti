import { getEmploymentProfile } from '@/app/app/profile/records-actions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { EmploymentForm } from './employment-form';

export default async function EmploymentPage() {
  const profile = await getEmploymentProfile();

  return (
    <div>
      <PageHeader
        title="Employment"
        description="Select every circumstance that applies. More than one can be true at once."
      />
      {profile ? (
        <EmploymentForm initial={profile} />
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
