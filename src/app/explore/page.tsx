import Link from 'next/link';
import { Search, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
        tags,
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
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-foreground" />
            <Link href="/" className="font-pixel text-sm font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase hidden sm:inline">
              {'//'} Scheme Catalogue
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
            >
              Get Matched →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-pixel text-xl sm:text-2xl text-foreground">
            EXPLORE SCHEMES
          </h1>
          <p className="text-xs text-muted-foreground">
            Official central and West Bengal government benefit programmes verified against primary gazette notifications.
          </p>
        </div>

        {/* Search */}
        <div className="border border-border bg-card p-3">
          <form method="get" className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Filter by keyword (e.g. scholarship, farmer, woman, pension)..."
              className="w-full border border-border bg-background py-2 pl-9 pr-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
            />
          </form>
        </div>

        {/* Scheme Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((scheme: any) => {
            const version = scheme.scheme_versions;
            return (
              <Card key={scheme.id} className="flex flex-col justify-between border-border hover:border-foreground transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="font-bold text-foreground">
                      {scheme.jurisdiction === 'central' ? 'Central Scheme' : scheme.state ?? 'West Bengal'}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{scheme.category}</span>
                  </div>
                  <CardTitle className="text-base mt-1">{scheme.name}</CardTitle>
                  {scheme.name_bn && (
                    <p className="font-bengali text-xs text-muted-foreground">{scheme.name_bn}</p>
                  )}
                  {scheme.ministry_label && (
                    <CardDescription className="text-[11px] mt-0.5">{scheme.ministry_label}</CardDescription>
                  )}
                  {scheme.tags && scheme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scheme.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-muted text-foreground uppercase tracking-tight"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {scheme.short_description}
                  </p>
                  {version?.benefit_summary_en && (
                    <div className="border border-border bg-background p-2 text-xs text-foreground">
                      <span className="font-bold text-[10px] uppercase text-muted-foreground block">{'//'} Benefit</span>
                      {version.benefit_summary_en}
                    </div>
                  )}

                  <div className="border-t border-border pt-2 flex items-center justify-between text-xs">
                    <Link
                      href={`/app/schemes/${scheme.id}`}
                      className="font-bold text-foreground hover:underline inline-flex items-center gap-1"
                    >
                      Check Eligibility Rules <ArrowRight className="h-3 w-3" />
                    </Link>
                    {scheme.portal_url && (
                      <a
                        href={scheme.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground"
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

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PRAPTI // Deterministic Government Benefits Discovery Engine
      </footer>
    </div>
  );
}
