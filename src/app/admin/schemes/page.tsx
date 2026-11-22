import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { StatusNotice } from '@/components/ui/status-notice';
import { CreateSchemeForm } from './scheme-forms';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
  retired: 'Retired',
};

type SchemeRow = { id: string; slug: string; name: string; status: string };

export default async function AdminSchemesPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <StatusNotice tone="warning" title="We could not load schemes">
        <p>Supabase is not configured.</p>
      </StatusNotice>
    );
  }

  const { data, error } = await supabase
    .from('schemes')
    .select('id, slug, name, status')
    .order('slug', { ascending: true });
  if (error) {
    console.error('admin schemes list failed', error.code);
  }
  const schemes = error ? null : ((data ?? []) as SchemeRow[]);

  return (
    <div>
      <PageHeader
        title="Schemes"
        description="Draft, check and publish the government schemes citizens can see."
      />

      {schemes === null ? (
        <StatusNotice tone="warning" title="We could not load schemes">
          <p>Try again in a moment.</p>
        </StatusNotice>
      ) : schemes.length === 0 ? (
        <StatusNotice tone="info" title="No schemes yet">
          <p>Create the first scheme draft below.</p>
        </StatusNotice>
      ) : (
        <ul className="mb-8 space-y-3">
          {schemes.map((scheme) => (
            <li key={scheme.id}>
              <Card>
                <CardContent>
                  <Link href={`/admin/schemes/${scheme.id}`} className="font-medium text-primary underline">
                    {scheme.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {scheme.slug} · {STATUS_LABELS[scheme.status] ?? scheme.status}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateSchemeForm />
    </div>
  );
}
