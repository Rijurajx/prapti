import Link from 'next/link';
import { Search, ShieldCheck, Scale, FileText, CheckCircle2 } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function HowItWorksPage() {
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 space-y-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How PRAPTI Works
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Understanding Indian government benefits should not require navigating dozen different portals, guessing complex rules, or risking your private identity numbers. Here is how PRAPTI helps you find, verify, and track your claims.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                  1
                </div>
                <CardTitle className="text-lg">Profile-Driven Circumstance Mapping</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                Instead of making you search through hundreds of government portals or choose a single narrow category, PRAPTI asks simple questions about your actual circumstances: your age, education level, district, occupation, and family income range.
              </p>
              <p>
                One person can belong to multiple categories simultaneously: a college student who is also a farmer&apos;s daughter and a rural resident.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                  2
                </div>
                <CardTitle className="text-lg">AI Assists; Deterministic Logic Decides</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                We use Google Gemini AI strictly to understand natural language input in English and Bengali. Generative AI is <strong>never allowed to invent scheme rules or decide final eligibility</strong>.
              </p>
              <p>
                Eligibility is evaluated by a deterministic 3-valued rule engine (Kleene logic) that tests your facts against official government gazette rules. If information is missing, the engine reports &quot;Needs More Information&quot; with a specific explanation, rather than guessing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                  3
                </div>
                <CardTitle className="text-lg">Eligibility is Different from Document Readiness</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                You can be likely eligible for a scholarship even if you do not yet have an income certificate or domicile certificate in hand.
              </p>
              <p>
                PRAPTI separates eligibility matching from document readiness. We show you what you qualify for and provide step-by-step guides on how to obtain missing certificates from BDO, SDO, or municipal offices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm">
                  4
                </div>
                <CardTitle className="text-lg">Privacy by Design: Zero Aadhaar Numbers Collected</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                PRAPTI never asks for, collects, or stores your Aadhaar number, PAN card number, or identity documents. We track only whether you have a document available.
              </p>
              <p>
                Each family member in a household retains their own independent profile, and adult members must grant explicit permission before another member can view their details.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 text-center space-y-4">
          <h2 className="text-xl font-semibold">Ready to discover benefits you qualify for?</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Create your profile in 2 minutes or chat with our AI assistant to see your personalized opportunities.
          </p>
          <div className="pt-2">
            <LinkButton size="lg" href="/auth/sign-up">
              Discover Your Benefits
            </LinkButton>
          </div>
        </div>
      </main>
    </div>
  );
}

