import { redirect } from 'next/navigation';

export default function ProfileAssetsPage() {
  redirect('/dashboard?tab=profile_finance');
}
