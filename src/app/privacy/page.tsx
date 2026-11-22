import Link from 'next/link';
import { LinkButton } from '@/components/ui/link-button';

export default function PublicPrivacyPolicyPage() {
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
              Get Started
            </LinkButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground">Last updated: November 2026</p>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Privacy by Design Principle</h2>
            <p>
              PRAPTI is engineered to collect only the minimum factual information necessary to assess potential government scheme eligibility.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. No Aadhaar or Identity Document Number Collection</h2>
            <p>
              <strong>We never collect, store, or process Aadhaar numbers, PAN numbers, Voter ID numbers, Passport numbers, or driving licence numbers.</strong> We only track document availability flags (&quot;available&quot;, &quot;applied for&quot;, &quot;unsure&quot;) to help you prepare your application checklist.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. What We Store</h2>
            <p>
              We store the basic profile facts you explicitly enter: your name, birthdate (to calculate age), gender, state, district, education history, occupation, and family income range. All citizen rows are protected by PostgreSQL Row Level Security (RLS).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Household Data Boundaries</h2>
            <p>
              Creating a household workspace gives the creator zero automatic access to other adult members&apos; profiles. Adult family members must give informed, explicit consent before any data is visible to another account. Consent can be revoked at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. AI and Third Parties</h2>
            <p>
              When you use our conversational assistant, your free-text message is processed server-side by Google Gemini solely for information extraction. Gemini never receives your personal identity numbers, and extracted facts are shown to you for confirmation before anything is saved.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Your Rights</h2>
            <p>
              You may export a full machine-readable JSON copy of your stored data or request profile deletion at any time from your account privacy settings.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

