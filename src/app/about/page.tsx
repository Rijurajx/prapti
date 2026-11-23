import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Github, Mail } from 'lucide-react';

export default async function AboutPage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes('-auth-token'));

  let user = null;
  if (hasAuthCookie) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
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
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Schemes
            </Link>
            <Link href="/about" className="text-foreground font-bold border-b border-foreground">
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

          <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 shrink-0">
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
                  Get Started →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            ABOUT PRAPTI
          </h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {'//'} Your Benefits. Your Rights. Your Claim.
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            India provides extensive social safety nets, educational scholarships, agricultural subsidies, nutrition support, and women&apos;s empowerment allowances. However, millions of eligible citizens do not claim benefits simply because government information is fragmented across disparate portals and complex gazette orders.
          </p>

          <div className="border border-border bg-card p-4 space-y-2 rounded-lg">
            <p className="font-bold text-foreground">
              PRAPTI (প্রাপ্তি — meaning attainment or receipt of what is rightfully yours)
            </p>
            <p>
              An intelligent citizen-benefits companion that understands your individual and family circumstances and evaluates them against a verified, database-backed all-India scheme catalogue.
            </p>
          </div>

          <h2 className="font-mono font-bold text-sm text-foreground pt-4">{'//'} Core Commitments</h2>
          <ul className="border border-border divide-y divide-border bg-card rounded-lg overflow-hidden">
            <li className="p-3">
              <strong className="text-foreground">No fabricated schemes:</strong> Every scheme in our registry is verified against official government notifications with full citation links.
            </li>
            <li className="p-3">
              <strong className="text-foreground">Deterministic verification:</strong> A 3-valued Kleene logic engine evaluates rules; generative AI assists with language understanding but never invents rules or decides outcomes.
            </li>
            <li className="p-3">
              <strong className="text-foreground">No documents or ID numbers stored:</strong> We never collect, ask for, or store Aadhaar numbers, PAN, or document scans.
            </li>
            <li className="p-3">
              <strong className="text-foreground">Bilingual &amp; Multilingual access:</strong> Native support for English and Bengali, accessible on mobile devices for citizens across urban and rural India.
            </li>
          </ul>

          <h2 className="font-mono font-bold text-sm text-foreground pt-4">{'//'} Pan-India Coverage</h2>
          <p>
            PRAPTI covers flagship Central Government initiatives (such as PM-KISAN, PM Ujjwala, PMAY, PM SVANidhi, and PM Mudra) alongside key state welfare programs in <strong className="text-foreground">West Bengal, Rajasthan (Annapurna Bhandar), Maharashtra (Majhi Ladki Bahin), Karnataka (Gruha Lakshmi), Tamil Nadu (Magalir Urimai), Delhi (Ladli &amp; Jai Bhim), Uttar Pradesh, and Telangana</strong>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-xs text-muted-foreground bg-card/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">PRAPTI</span>
            <span>{'//'}</span>
            <span>YOUR BENEFITS. YOUR RIGHTS. YOUR CLAIM.</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/about" className="text-foreground font-bold">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              How It Works
            </Link>
            <Link href="/explore" className="hover:text-foreground">
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
