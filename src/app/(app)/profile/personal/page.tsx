import { redirect } from 'next/navigation';

export default function ProfilePersonalPage() {
  redirect('/dashboard?tab=profile_personal');
}
