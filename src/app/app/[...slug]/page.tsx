import { notFound, redirect } from 'next/navigation';
import { Construction } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { appNavSections } from '@/components/app-shell/sidebar';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/link-button';

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const path = '/app/' + slug.join('/');

  const item = appNavSections
    .flatMap((s) => s.items)
    .find((i) => i.href === path);
  if (!item) notFound();

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <>
      <PageHeader title={item.label} />
      <EmptyState
        icon={<Construction className="h-6 w-6" aria-hidden />}
        title="This section is not built yet"
        description="It is planned for a later stage of PRAPTI. Nothing here is saved or calculated yet."
        action={
          <LinkButton variant="secondary" size="sm" href="/app/dashboard">
            Back to dashboard
          </LinkButton>
        }
      />
    </>
  );
}
