import { redirect } from 'next/navigation';

export default function OpportunitiesPage() {
  redirect('/dashboard?tab=opportunities');
}
