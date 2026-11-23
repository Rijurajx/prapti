import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function HowItWorksPage() {
  const supabase = await createSupabaseServerClient();
  let user = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

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
              {'//'} Methodology & Architecture
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/app/dashboard"
                className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
              >
                Dashboard →
              </Link>
            ) : (
              <>
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
                  Start Matching →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-2">
          <h1 className="font-pixel text-2xl sm:text-3xl text-foreground">
            HOW PRAPTI WORKS
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Understanding Indian government benefits without navigating 40 different portals, guessing complex rules, or compromising private identity numbers.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-sm bg-foreground text-background px-2 py-0.5">01</span>
                <CardTitle className="text-base font-bold">Profile-Driven Circumstance Mapping</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Instead of making you search through hundreds of government portals or choose a single narrow category, PRAPTI records your actual circumstances: age (calculated dynamically from DOB), education level, district, occupation, land ownership, and family income range.
              </p>
              <p>
                One citizen can belong to multiple categories simultaneously: a college student who is also a farmer&apos;s daughter and a rural resident.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-sm bg-foreground text-background px-2 py-0.5">02</span>
                <CardTitle className="text-base font-bold">AI Assists; Deterministic Logic Decides</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                We use Google Gemini AI strictly for natural language understanding and multilingual dialogue in English and Bengali. Generative AI is <strong>never allowed to invent scheme rules or decide final eligibility</strong>.
              </p>
              <p>
                Eligibility is evaluated by a deterministic 3-valued rule engine (Kleene logic) that rigorously tests your facts against official government gazette rules. If information is missing, the engine reports &quot;Needs More Information&quot; with a specific explanation, rather than guessing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-sm bg-foreground text-background px-2 py-0.5">03</span>
                <CardTitle className="text-base font-bold">Eligibility Separated from Document Readiness</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Being eligible is not the same as being ready to apply. You might qualify for a scholarship but lack an updated income certificate.
              </p>
              <p>
                PRAPTI evaluates document readiness separately and provides actionable step-by-step guidance on how to obtain missing certificates before official submission deadlines.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="font-pixel text-sm bg-foreground text-background px-2 py-0.5">04</span>
                <CardTitle className="text-base font-bold">Privacy by Design (Zero Aadhaar Collection)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                PRAPTI <strong>never collects, asks for, or stores your Aadhaar number</strong> or sensitive identity copies.
              </p>
              <p>
                We only record whether you possess a document as a boolean readiness flag. You retain full control over your data with one-click cryptographic export and instant profile deletion.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-foreground">Ready to discover your benefits?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Takes less than 3 minutes to evaluate against all verified state & central schemes.
            </p>
          </div>
          <Link
            href="/auth/sign-up"
            className="bg-foreground text-background px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors whitespace-nowrap"
          >
            Create Citizen Profile →
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        PRAPTI // Transparent Citizen Welfare Discovery
      </footer>
    </div>
  );
}
