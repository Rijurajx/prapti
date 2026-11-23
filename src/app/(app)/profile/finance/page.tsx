import { redirect } from 'next/navigation';

export default function ProfileFinancePage() {
  redirect('/dashboard?tab=profile_finance');
}
