import { redirect } from 'next/navigation';

export default function ApplicationsPage() {
  redirect('/app/dashboard?tab=applications');
}
