import { redirect } from 'next/navigation';

export default function ProfileEducationPage() {
  redirect('/dashboard?tab=profile_education');
}
