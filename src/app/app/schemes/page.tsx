import { redirect } from 'next/navigation';

export default function SchemesPage() {
  redirect('/app/dashboard?tab=schemes');
}
