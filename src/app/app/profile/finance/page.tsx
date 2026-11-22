import { redirect } from 'next/navigation';

export default function ProfileFinancePage() {
  redirect('/app/dashboard?tab=profile_finance');
}
