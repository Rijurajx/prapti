import { redirect } from 'next/navigation';

export default function ProfileDocumentsPage() {
  redirect('/app/dashboard?tab=profile_documents');
}
