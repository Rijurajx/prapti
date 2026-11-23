import { redirect } from 'next/navigation';

export default function ProfileDocumentsPage() {
  redirect('/dashboard?tab=profile_documents');
}
