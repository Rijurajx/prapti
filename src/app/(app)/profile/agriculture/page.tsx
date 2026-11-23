import { redirect } from 'next/navigation';

export default function ProfileAgriculturePage() {
  redirect('/dashboard?tab=profile_agriculture');
}
