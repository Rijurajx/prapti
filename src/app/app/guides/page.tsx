import { redirect } from 'next/navigation';

export default function GuidesPage() {
  redirect('/app/dashboard?tab=guides');
}
