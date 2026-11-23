import { redirect } from 'next/navigation';

export default function HouseholdPage() {
  redirect('/dashboard?tab=family_members');
}
