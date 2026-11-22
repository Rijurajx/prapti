import { redirect } from 'next/navigation';

export default function ProfileAddressPage() {
  redirect('/app/dashboard?tab=profile_personal');
}
