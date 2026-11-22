import Link from 'next/link';
import { ClipboardCheck, FileCheck2, Search, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const steps = [
  {
    icon: Search,
    title: 'Tell us about your circumstances',
    description:
      'Answer short questions about age, address, education, income and work. You can skip anything you do not want to share.',
  },
  {
    icon: ClipboardCheck,
    title: 'See what may apply',
    description:
      'Schemes are checked against their published rules. Results are shown as likely eligible, needs more information, likely ineligible, or cannot be assessed until the rules are verified.',
  },
  {
    icon: FileCheck2,
    title: 'Prepare and track',
    description:
      'See the documents each scheme asks for, follow the official application steps, and track your own progress and deadlines.',
  },
];

const privacyPoints = [
  'We collect only what a scheme\'s rules need.',
  'We never ask for Aadhaar numbers or other identity-document numbers.',
  'You control your own profile. Other adult family members see your information only if you allow it.',
  'Results are guidance, not a promise of benefit or approval.',
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            PRAPTI
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/explore" className="text-xs font-medium text-muted-foreground hover:text-foreground hidden sm:block">
              Explore Schemes
            </Link>
            <Link href="/how-it-works" className="text-xs font-medium text-muted-foreground hover:text-foreground hidden sm:block">
              How It Works
            </Link>
            <LinkButton variant="ghost" size="sm" href="/auth/sign-in">
              Sign in
            </LinkButton>
            <LinkButton size="sm" href="/auth/sign-up">
              Create account
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Citizen Benefits Discovery for West Bengal & India</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl max-w-3xl leading-tight">
            Your Benefits. Your Rights. Your Claim.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground text-base sm:text-lg leading-relaxed">
            PRAPTI is an intelligent citizen-benefits companion that helps you and your family discover
            government schemes you qualify for, understand official requirements, and manage your applications
            with zero identity-document number collection.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton size="lg" href="/auth/sign-up">
              Discover Your Benefits <ArrowRight className="ml-1.5 h-4 w-4" />
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="/explore">
              Explore Schemes
            </LinkButton>
            <LinkButton variant="ghost" size="lg" href="/how-it-works">
              How It Works
            </LinkButton>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-border bg-card/40 py-12 sm:py-16"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Transparent, evidence-based matching in three clear steps.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title}>
                    <CardHeader>
                      <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/how-it-works"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Read the full methodology and safety rules <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            How PRAPTI handles your information
          </h2>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground leading-relaxed">
            {privacyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            PRAPTI is an independent guidance tool. Always confirm scheme details on official government portals.
          </p>
          <nav className="flex flex-wrap items-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              How It Works
            </Link>
            <Link href="/explore" className="hover:text-foreground">
              Explore Schemes
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Use
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
