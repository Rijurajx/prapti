import { redirect } from 'next/navigation';

export default function HelpPage() {
  redirect('/app/dashboard?tab=help');
}
