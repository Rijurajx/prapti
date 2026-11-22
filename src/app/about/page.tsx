import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-foreground" />
            <Link href="/" className="font-pixel text-sm font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase hidden sm:inline">
              {'//'} Mission & Principles
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
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-pixel text-2xl sm:text-3xl text-foreground">ABOUT PRAPTI</h1>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {'//'} Your Benefits. Your Rights. Your Claim.
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            India provides extensive social safety nets, educational scholarships, agricultural subsidies, and women&apos;s empowerment allowances. However, millions of eligible citizens do not claim benefits simply because government information is fragmented across disparate portals and complex gazette orders.
          </p>

          <div className="border border-border bg-card p-4 space-y-2">
            <p className="font-bold text-foreground">
              PRAPTI (প্রাপ্তি — meaning attainment or receipt of what is rightfully yours)
            </p>
            <p>
              An intelligent citizen-benefits companion that understands your individual and household circumstances and evaluates them against a verified, database-backed government scheme catalogue.
            </p>
          </div>

          <h2 className="font-pixel text-sm text-foreground pt-4">{'//'} Core Commitments</h2>
          <ul className="border border-border divide-y divide-border bg-card">
            <li className="p-3">
              <strong className="text-foreground">No fabricated schemes:</strong> Every scheme in our registry is verified against official government notifications with full citation links.
            </li>
            <li className="p-3">
              <strong className="text-foreground">Deterministic verification:</strong> A 3-valued Kleene logic engine evaluates rules; generative AI assists with language extraction but never invents rules or decides outcomes.
            </li>
            <li className="p-3">
              <strong className="text-foreground">Zero Aadhaar collection:</strong> We never collect, ask for, or store Aadhaar numbers or identity document copies.
            </li>
            <li className="p-3">
              <strong className="text-foreground">Bilingual access:</strong> Native support for English and Bengali, accessible on mobile devices for citizens across urban and rural Bengal.
            </li>
          </ul>

          <h2 className="font-pixel text-sm text-foreground pt-4">{'//'} Geographical Focus</h2>
          <p>
            PRAPTI launches with an initial deep focus on <strong className="text-foreground">West Bengal</strong>, covering state flagships such as Kanyashree Prakalpa, Swami Vivekananda Merit-cum-Means Scholarship (SVMCM), Lakshmir Bhandar, Krishak Bandhu, and Yuvasree, alongside Central Government initiatives such as PM-KISAN. The architecture is engineered to scale across all Indian states and union territories.
          </p>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PRAPTI // Transparent Citizen Welfare Discovery
      </footer>
    </div>
  );
}
