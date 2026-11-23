import { redirect } from 'next/navigation';

export default function ProfileAddressPage() {
  redirect('/dashboard?tab=profile_personal');
}
