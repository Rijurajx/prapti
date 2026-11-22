import { redirect } from 'next/navigation';

export default function ProfileEducationPage() {
  redirect('/app/dashboard?tab=profile_education');
}
