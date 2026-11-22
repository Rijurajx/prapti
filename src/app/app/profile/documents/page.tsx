import { getDocumentStatuses, getDocumentTypes } from '@/app/app/profile/records-actions';
import { PageHeader } from '@/components/ui/page-header';
import { StatusNotice } from '@/components/ui/status-notice';
import { LinkButton } from '@/components/ui/link-button';
import { DocumentsForm, type DocumentRow } from './documents-form';
import { DOCUMENT_STATUS_VALUES } from '@/lib/validation/finance-education-documents';

type DocumentStatusValue = (typeof DOCUMENT_STATUS_VALUES)[number];

export default async function DocumentsPage() {
  const [types, statuses] = await Promise.all([getDocumentTypes(), getDocumentStatuses()]);

  const rows: DocumentRow[] = types.map((t) => {
    const saved = statuses[t.code];
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

  if (types.length === 0) {
    return (
      <StatusNotice tone="warning" title="Document list unavailable">
        The document list could not be loaded. Try again later.
      </StatusNotice>
    );
  }

  return (
    <>
      <PageHeader
        title="My documents"
        description="Record whether you have each document. PRAPTI never asks for identity numbers or copies. Availability is not verified and does not confirm that a document is valid."
      />
      <DocumentsForm rows={rows} />
    </>
  );
}
