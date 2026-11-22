import { redirect } from 'next/navigation';

export default function ProfilePersonalPage() {
  redirect('/app/dashboard?tab=profile_personal');
}
