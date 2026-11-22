import { getPersonalDetails } from '@/app/app/profile/actions';
import { LinkButton } from '@/components/ui/link-button';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { PersonalDetailsForm } from './personal-form';

export default async function PersonalDetailsPage() {
  const details = await getPersonalDetails();

  if (!details) {
    return (
      <div className="space-y-5">
        <PageHeader title="Personal details" />
        <StatusNotice tone="warning" title="We could not load your details">
          <p>Sign in again, or check your configuration.</p>
          <div className="mt-3">
            <LinkButton href="/auth/sign-in" variant="secondary" size="sm">
              Sign in
            </LinkButton>
          </div>
        </StatusNotice>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Personal details"
        description="Used only to check which schemes' age and marital-status rules apply to you. You can skip any question."
      />
      <PersonalDetailsForm initial={details} />
    </div>
  );
}
