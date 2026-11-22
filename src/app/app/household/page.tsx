import { redirect } from 'next/navigation';

export default function HouseholdPage() {
  redirect('/app/dashboard?tab=household');
}
