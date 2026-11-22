import { ClipboardCheck, FileCheck2, Search, ShieldCheck } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="text-base font-semibold">PRAPTI</span>
          <nav className="flex items-center gap-2">
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
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Benefits. Your Rights. Your Claim.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            PRAPTI helps you find government schemes you may be eligible for,
            understand what each one requires, and keep track of your own
            applications. It does not submit applications for you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton size="lg" href="/auth/sign-up">
              Discover Your Benefits
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="#how-it-works">
              How It Works
            </LinkButton>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
        >
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title}>
                  <CardHeader>
                    <Icon className="mb-2 h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            How PRAPTI handles your information
          </h2>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {privacyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          PRAPTI is an independent guidance tool. It is not an official
          government service. Always confirm scheme details on the official
          portal.
        </p>
      </footer>
    </div>
  );
}
