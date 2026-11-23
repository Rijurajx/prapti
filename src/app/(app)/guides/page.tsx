import { redirect } from 'next/navigation';

export default function GuidesPage() {
  redirect('/dashboard?tab=guides');
}
