import { redirect } from 'next/navigation';

export default function ProfileEmploymentPage() {
  redirect('/app/dashboard?tab=profile_finance');
}
