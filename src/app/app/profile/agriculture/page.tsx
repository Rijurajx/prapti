import { redirect } from 'next/navigation';

export default function ProfileAgriculturePage() {
  redirect('/app/dashboard?tab=profile_agriculture');
}
