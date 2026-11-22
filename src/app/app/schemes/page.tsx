import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, BookOpen, ExternalLink, Bookmark } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LinkButton } from '@/components/ui/link-button';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'education', label: 'Education' },
  { value: 'women', label: 'Women & Child' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'employment', label: 'Employment' },
  { value: 'social_welfare', label: 'Social Welfare' },
];

export default async function SchemesDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; jurisdiction?: string }>;
}) {
  const { q = '', category = 'all', jurisdiction = 'all' } = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect('/config-required');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/sign-in');

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
        id,
        version_number,
        benefit_summary_en
      )
    `)
    .eq('status', 'published')
    .not('current_version_id', 'is', null)
    .order('created_at', { ascending: false });

  if (category !== 'all') {
    query = query.eq('category', category);
  }
  if (jurisdiction !== 'all') {
    query = query.eq('jurisdiction', jurisdiction);
  }
  if (q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }

  const { data: schemes } = await query;
  const list = schemes ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover Schemes"
        description="Browse the verified government scheme catalogue. Every listed scheme is backed by official sources and gazette publications."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <form method="get" className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search schemes by name or keyword..."
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {category !== 'all' && <input type="hidden" name="category" value={category} />}
          {jurisdiction !== 'all' && <input type="hidden" name="jurisdiction" value={jurisdiction} />}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            if (jurisdiction !== 'all') params.set('jurisdiction', jurisdiction);
            if (cat.value !== 'all') params.set('category', cat.value);
            const href = `/app/schemes?${params.toString()}`;

            return (
              <Link
                key={cat.value}
                href={href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Scheme List */}
      {list.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" aria-hidden />}
          title="No schemes matched your search"
          description="Try removing keywords or changing category filters to see more schemes."
          action={
            <LinkButton variant="secondary" size="sm" href="/app/schemes">
              Reset Filters
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {list.map((scheme: any) => {
            const version = scheme.scheme_versions;
            return (
              <Card key={scheme.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {scheme.jurisdiction === 'central' ? 'Central Government' : scheme.state ?? 'West Bengal'}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {scheme.category}
                    </span>
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

                <CardContent className="space-y-4 pt-0">
                  {version?.benefit_summary_en && (
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-foreground">
                      <strong>Benefit: </strong>
                      {version.benefit_summary_en}
                    </div>
                  )}

                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {scheme.short_description}
                  </p>

                  <div className="flex items-center justify-between border-t border-border/80 pt-3 text-xs">
                    <LinkButton variant="secondary" size="sm" href={`/app/schemes/${scheme.id}`}>
                      View Rules & Steps
                    </LinkButton>
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
      )}
    </div>
  );
}

