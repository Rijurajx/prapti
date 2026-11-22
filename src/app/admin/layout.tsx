import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireAdministrator } from '@/lib/admin/guard';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const guard = await requireAdministrator();
  if (!guard.ok) {
    redirect('/app/dashboard');
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h2 className="pb-6 text-lg font-semibold tracking-tight text-foreground">Administration</h2>
      {children}
    </div>
  );
}
