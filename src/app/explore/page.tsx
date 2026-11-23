import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Github, Mail } from 'lucide-react';
import { ExploreClientView } from './explore-client-view';

export const revalidate = 60;

export default async function PublicExplorePage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes('-auth-token'));

  let user = null;
  const supabase = await createSupabaseServerClient();
  let list: any[] = [];

  if (supabase) {
    if (hasAuthCookie) {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }

    const { data } = await supabase
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
        updated_at,
        created_at,
        scheme_versions!schemes_current_version_fk (
          benefit_summary_en,
          published_at,
          created_at
        )
      `)
      .eq('status', 'published')
      .not('current_version_id', 'is', null)
      .order('created_at', { ascending: false });

    list = data ?? [];
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5 text-foreground">
              <span className="inline-block h-3.5 w-3.5 bg-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
              </div>
            </div>
            <Link href="/" className="font-mono text-base font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase hidden sm:inline">
              {'//'} All-India Scheme Registry
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/explore" className="text-foreground font-bold border-b border-foreground">
              Schemes
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/future-expansion" className="hover:text-foreground transition-colors">
              Future Expansion
            </Link>
            <a
              href="https://github.com/Rijurajx/prapti"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/demo"
              className="rounded-full border border-foreground/40 bg-muted/40 hover:bg-foreground hover:text-background px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider transition-all shadow-sm shrink-0"
            >
              View Demo
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-foreground text-background px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
              >
                Dashboard →
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-4">
                <Link
                  href="/sign-in"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block px-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-foreground text-background px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
                >
                  Get Matched →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            EXPLORE SCHEMES
          </h1>
          <p className="text-xs text-muted-foreground">
            Browse all verified Central Government and State welfare programmes. Filter instantly by state, life stage, caste, gender, or livelihood.
          </p>
        </div>

        <ExploreClientView initialSchemes={list} />
      </main>

      <footer className="border-t border-border py-8 text-xs text-muted-foreground bg-card/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">PRAPTI</span>
            <span>{'//'}</span>
            <span>TRANSPARENT CITIZEN WELFARE DISCOVERY</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              How It Works
            </Link>
            <Link href="/explore" className="text-foreground font-bold">
              Schemes
            </Link>
            <Link href="/future-expansion" className="hover:text-foreground">
              Future Expansion
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <a
              href="mailto:rijurajdatta8@gmail.com"
              className="rounded-[3px] border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
