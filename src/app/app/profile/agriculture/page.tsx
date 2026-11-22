import { getAgriculturalProfile } from '@/app/app/profile/agriculture-actions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { AgricultureForm } from './agriculture-form';

export default async function AgriculturePage() {
  const profile = await getAgriculturalProfile();

  return (
    <div>
      <PageHeader
        title="Agriculture"
        description="Fill this in only if you farm, cultivate, or work on agricultural land. Skip it otherwise."
      />

      {profile === null ? (
        <StatusNotice tone="warning" title="We could not load your details">
          <p>Sign in again to continue.</p>
          <LinkButton href="/auth/sign-in" variant="secondary" size="sm" className="mt-3">
            Sign in
          </LinkButton>
        </StatusNotice>
      ) : (
        <AgricultureForm initial={profile} />
      )}
    </div>
  );
}
