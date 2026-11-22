import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, ExternalLink } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/link-button';

export default async function SavedSchemesPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

  const { data: citizen } = await supabase
    .from('citizen_profiles')
    .select('id')
    .eq('owner_user_id', user.id)
    .eq('relationship_to_owner', 'self')
    .maybeSingle();

  if (!citizen) {
    return redirect('/app/dashboard');
  }

  const { data: savedList } = await supabase
    .from('saved_schemes')
    .select(`
      id,
      created_at,
      schemes (
        id,
        slug,
        name,
        name_bn,
        ministry_label,
        category,
        jurisdiction,
        portal_url,
        short_description,
        scheme_versions!schemes_current_version_fk (
          benefit_summary_en
        )
      )
    `)
    .eq('citizen_id', citizen.id)
    .order('created_at', { ascending: false });

  const list = savedList ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Schemes"
        description="Schemes you have bookmarked for future reference and document preparation."
      />

      {list.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" aria-hidden />}
          title="No saved schemes yet"
          description="Bookmark schemes from the directory or your opportunities list to track them here."
          action={
            <LinkButton variant="secondary" size="sm" href="/app/schemes">
              Explore Schemes
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((item: any) => {
            const scheme = item.schemes;
            if (!scheme) return null;
            const version = scheme.scheme_versions;

            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{scheme.jurisdiction === 'central' ? 'Central' : 'West Bengal'}</span>
                    <span>•</span>
                    <span className="capitalize">{scheme.category}</span>
                  </div>
                  <CardTitle className="text-lg">
                    <Link href={`/app/schemes/${scheme.id}`} className="hover:underline">
                      {scheme.name}
                    </Link>
                  </CardTitle>
                  {scheme.name_bn && (
                    <p className="font-bengali text-sm text-muted-foreground">{scheme.name_bn}</p>
                  )}
                  {scheme.ministry_label && (
                    <CardDescription className="text-xs">{scheme.ministry_label}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {version?.benefit_summary_en && (
                    <div className="rounded-md bg-muted/40 p-2 text-xs">
                      <strong>Benefit: </strong> {version.benefit_summary_en}
                    </div>
                  )}
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {scheme.short_description}
                  </p>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <LinkButton variant="secondary" size="sm" href={`/app/schemes/${scheme.id}`}>
                      View Details
                    </LinkButton>
                    {scheme.portal_url && (
                      <a
                        href={scheme.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

