import Link from 'next/link';

export default function TermsOfUsePage() {
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
              {'//'} Terms of Advisory Service
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
          <h1 className="font-pixel text-2xl sm:text-3xl text-foreground">TERMS OF USE</h1>
          <p className="text-xs text-muted-foreground">{'//'} Legal Advisory Disclaimers {'//'} Last updated: November 2026</p>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 1. Independent Informational Companion</h2>
            <p>
              PRAPTI is an independent citizen-benefits discovery and application assistance tool. PRAPTI is not affiliated with, authorized by, endorsed by, or an official agency of the Government of India, the Government of West Bengal, or any municipal authority.
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 2. Advisory Evaluation Only (No False Promises)</h2>
            <p>
              All eligibility evaluations produced by PRAPTI are advisory estimations based on published government rules and facts provided by the user. PRAPTI cannot make legally binding entitlement determinations. Final sanction, benefit approval, and fund disbursement remain strictly within the statutory authority of official government officers.
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 3. Official Application Channels</h2>
            <p>
              PRAPTI does not directly submit applications or collect official government processing fees. All applications must be submitted by the citizen through the designated official government portals (e.g. wbkanyashree.gov.in, svmcm.wbhed.gov.in, banglarbhumi.gov.in) or physical government camps (such as Duare Sarkar or BDO offices).
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 4. User Accuracy</h2>
            <p>
              The correctness of rule evaluations depends on the accuracy of the facts you record. PRAPTI is not liable for inaccurate recommendations resulting from incomplete, outdated, or mistaken inputs.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PRAPTI // Transparent Citizen Welfare Discovery
      </footer>
    </div>
  );
}
