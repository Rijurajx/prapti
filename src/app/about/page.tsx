import Link from 'next/link';
import { LinkButton } from '@/components/ui/link-button';

export default function AboutPage() {
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">About PRAPTI</h1>
          <p className="mt-2 text-lg text-primary font-medium">Your Benefits. Your Rights. Your Claim.</p>
        </div>

        <div className="prose prose-neutral dark:prose-invert text-sm leading-relaxed space-y-4 text-muted-foreground">
          <p>
            India provides extensive social safety nets, educational scholarships, agricultural subsidies, and women&apos;s empowerment allowances. However, millions of eligible citizens do not claim benefits simply because government information is fragmented across disparate portals and complex gazette orders.
          </p>

          <p>
            <strong>PRAPTI</strong> (প্রাপ্তি — meaning <em>attainment</em> or <em>receipt of what is rightfully yours</em>) was created to bridge this critical information gap. We are an intelligent citizen-benefits companion that understands your individual and household circumstances and matches them against a verified, database-backed government scheme catalogue.
          </p>

          <h2 className="text-base font-semibold text-foreground pt-4">Our Core Commitments</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>No fabricated schemes:</strong> Every scheme in our registry is verified against official government notifications.</li>
            <li><strong>No fake results:</strong> Deterministic rule evaluation strictly replaces generative AI guesses.</li>
            <li><strong>No identity collection:</strong> Zero storage of Aadhaar numbers or government identity numbers.</li>
            <li><strong>Bilingual access:</strong> Native support for English and Bengali, accessible on mobile devices for citizens across urban and rural Bengal.</li>
          </ul>

          <h2 className="text-base font-semibold text-foreground pt-4">Geographical Focus</h2>
          <p>
            PRAPTI launches with an initial deep focus on <strong>West Bengal</strong>, covering state flagships such as Kanyashree Prakalpa, Swami Vivekananda Merit-cum-Means Scholarship (SVMCM), Lakshmir Bhandar, Krishak Bandhu, and Yuvasree, alongside Central Government initiatives such as PM-KISAN. The architecture is engineered to scale across all Indian states and union territories.
          </p>
        </div>
      </main>
    </div>
  );
}

