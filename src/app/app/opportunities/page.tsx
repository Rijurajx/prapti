import { redirect } from 'next/navigation';

export default function OpportunitiesPage() {
  redirect('/app/dashboard?tab=opportunities');
}
