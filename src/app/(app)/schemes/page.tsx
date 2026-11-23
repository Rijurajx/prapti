import { redirect } from 'next/navigation';

export default function SchemesPage() {
  redirect('/dashboard?tab=schemes');
}
