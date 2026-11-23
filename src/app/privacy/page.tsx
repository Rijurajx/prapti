import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PublicPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-block h-3 w-3 bg-foreground" />
            <Link href="/" className="font-mono text-base font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 space-y-6">
        <div className="space-y-1">
          <h1 className="font-pixel text-2xl sm:text-3xl text-foreground">PRIVACY POLICY</h1>
          <p className="text-xs text-muted-foreground">{'//'} Last audited: November 2026 {'//'} Zero Aadhaar Protocol</p>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 1. Privacy by Design Principle</h2>
            <p>
              PRAPTI is engineered to collect only the minimum factual information necessary to assess potential government scheme eligibility.
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 2. Zero Aadhaar & ID Number Collection</h2>
            <p>
              <strong className="text-foreground">We never collect, store, or process Aadhaar numbers, PAN numbers, Voter ID numbers, Passport numbers, or driving licence numbers.</strong> We only track document availability flags (&quot;available&quot;, &quot;applied for&quot;, &quot;unsure&quot;) to help you prepare your application checklist.
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 3. What We Store</h2>
            <p>
              We store the basic profile facts you explicitly enter: your name, birthdate (to calculate age), gender, state, district, education history, occupation, and family income range. All citizen rows are protected by PostgreSQL Row Level Security (RLS).
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 4. Household Data Boundaries</h2>
            <p>
              Creating a household workspace gives the creator zero automatic access to other adult members&apos; profiles. Adult family members must give informed, explicit consent before any data is visible to another account. Consent can be revoked at any time.
            </p>
          </section>

          <section className="border border-border bg-card p-4 space-y-2">
            <h2 className="font-pixel text-xs text-foreground">{'//'} 5. AI Safety & Third Parties</h2>
            <p>
              When you use our conversational assistant, your message is processed server-side by Google Gemini solely for structured information extraction. Gemini never receives personal identity numbers, and extracted facts are shown to you for confirmation before anything is saved.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-xs text-muted-foreground bg-card/40">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>PRAPTI // Transparent Citizen Welfare Discovery</span>
          <a
            href="mailto:rijurajdatta8@gmail.com"
            className="hover:text-foreground font-bold underline"
          >
            Contact Us: rijurajdatta8@gmail.com
          </a>
        </div>
      </footer>
    </div>
  );
}
