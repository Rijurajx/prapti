import { redirect } from 'next/navigation';

export default function RemindersPage() {
  redirect('/app/dashboard?tab=reminders');
}
