import Link from 'next/link';
import { LinkButton } from '@/components/ui/link-button';

export default function TermsOfUsePage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
        <p className="text-xs text-muted-foreground">Last updated: November 2026</p>

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Purpose and Nature of the Service</h2>
            <p>
              PRAPTI is an independent informational discovery and application assistance tool. PRAPTI is not affiliated with, authorized by, or an agent of the Government of India, the Government of West Bengal, or any municipal authority.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. No Guarantee of Eligibility or Benefit Approval</h2>
            <p>
              All eligibility evaluations produced by PRAPTI are advisory guidance based on published rules and user-entered facts. PRAPTI does not make binding eligibility determinations. Final approval, benefit sanction, and disbursement are solely within the jurisdiction of the competent government authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Official Application Channels</h2>
            <p>
              PRAPTI does not directly submit applications, issue identity cards, or collect government processing fees. All applications must be submitted by the citizen through the designated official portals (e.g. wbkanyashree.gov.in, svmcm.wbhed.gov.in) or physical government camps (such as Duare Sarkar or BDO offices).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. User Accuracy</h2>
            <p>
              The accuracy of scheme matches depends on the accuracy of the facts you provide. PRAPTI is not responsible for inaccurate evaluations resulting from incorrect or outdated user information.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

