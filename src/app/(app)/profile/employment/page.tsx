import { redirect } from 'next/navigation';

export default function ProfileEmploymentPage() {
  redirect('/dashboard?tab=profile_finance');
}
