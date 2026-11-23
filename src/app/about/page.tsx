import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
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
              {'//'} Mission &amp; Principles
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
                >
                  Get Started →
                </Link>
              </>
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

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-card/40">
        PRAPTI // Transparent Citizen Welfare Discovery &amp; Deterministic Rules Engine
      </footer>
    </div>
  );
}
