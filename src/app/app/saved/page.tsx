import { redirect } from 'next/navigation';

export default function SavedPage() {
  redirect('/app/dashboard?tab=saved');
}
