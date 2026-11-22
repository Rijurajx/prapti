import { redirect } from 'next/navigation';

export default function PrivacyPage() {
  redirect('/app/dashboard?tab=privacy');
}
