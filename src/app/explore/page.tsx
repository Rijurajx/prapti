import Link from 'next/link';
import { Search, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';

export default async function PublicExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = '', category = 'all' } = await searchParams;

  const supabase = await createSupabaseServerClient();
  let list: any[] = [];

  if (supabase) {
    let query = supabase
      .from('schemes')
      .select(`
        id,
        slug,
        name,
        name_bn,
        ministry_label,
        category,
        jurisdiction,
        state,
        portal_url,
        short_description,
        scheme_versions!schemes_current_version_fk (
          benefit_summary_en
        )
      `)
      .eq('status', 'published')
      .not('current_version_id', 'is', null)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category);
    }
    if (q.trim()) {
      query = query.ilike('name', `%${q.trim()}%`);
    }

    const { data } = await query;
    list = data ?? [];
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            PRAPTI
          </Link>
          <div className="flex items-center gap-3">
            <LinkButton variant="ghost" size="sm" href="/auth/sign-in">
              Sign in
            </LinkButton>
            <LinkButton size="sm" href="/auth/sign-up">
              Get Personalized Matches
            </LinkButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Explore Government Schemes
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Browse verified West Bengal state and Central government benefit schemes. Create a profile to evaluate your personal eligibility.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-lg border border-border bg-card p-4">
          <form method="get" className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search schemes by name or keyword..."
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </form>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((scheme: any) => {
            const version = scheme.scheme_versions;
            return (
              <Card key={scheme.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{scheme.jurisdiction === 'central' ? 'Central' : scheme.state ?? 'West Bengal'}</span>
                    <span>•</span>
                    <span className="capitalize">{scheme.category}</span>
                  </div>
                  <CardTitle className="text-lg">{scheme.name}</CardTitle>
                  {scheme.name_bn && (
                    <p className="font-bengali text-sm text-muted-foreground">{scheme.name_bn}</p>
                  )}
                  {scheme.ministry_label && (
                    <CardDescription className="text-xs">{scheme.ministry_label}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {version?.benefit_summary_en && (
                    <div className="rounded-md bg-muted/40 p-2.5 text-xs text-foreground">
                      <strong>Benefit: </strong> {version.benefit_summary_en}
                    </div>
                  )}

                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {scheme.short_description}
                  </p>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <Link
                      href="/auth/sign-up"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Check Eligibility <ArrowRight className="h-3 w-3" />
                    </Link>
                    {scheme.portal_url && (
                      <a
                        href={scheme.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        Official Portal <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

