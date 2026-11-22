import { listEducationRecords } from '@/app/app/profile/records-actions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { EducationManager } from './education-manager';

export default async function EducationPage() {
  const records = await listEducationRecords();
  return (
    <div>
      <PageHeader
        title="Education"
        description="Add your education history. Enter results as they appear on your marksheet. You can skip any stage that does not apply, and you do not need to re-enter anything for each scheme."
      />
      <EducationManager records={records} />
    </div>
  );
}
