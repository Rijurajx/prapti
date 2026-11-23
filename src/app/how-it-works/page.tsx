import Link from 'next/link';
import { cookies } from 'next/headers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Users,
  Scale,
  ShieldCheck,
  FileCheck2,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export default async function HowItWorksPage() {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some((c) => c.name.includes('-auth-token'));

  let user = null;
  if (hasAuthCookie) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-0.5 text-foreground">
              <span className="inline-block h-3.5 w-3.5 bg-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
              </div>
            </div>
            <Link href="/" className="font-mono text-base font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
            <span className="text-[10px] text-muted-foreground ml-2 uppercase hidden sm:inline">
              {'//'} Methodology &amp; Architecture
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-foreground text-background px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
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
          <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            HOW PRAPTI WORKS
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Discover verified Indian government schemes across Central and State jurisdictions without navigating 40 different portals, guessing complex rules, or uploading sensitive identity documents.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-foreground text-background px-2 py-0.5 font-bold rounded-[2px]">
                    01
                  </span>
                  <CardTitle className="text-base font-bold text-foreground">
                    Multi-Characteristic Profile &amp; Family Member Mapping
                  </CardTitle>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Instead of forcing you to search through isolated websites, PRAPTI records your circumstances: age, educational achievements, state/district, occupation, land ownership, and family income range.
              </p>
              <p>
                A single citizen can belong to overlapping demographic groups (e.g. a female student from an agricultural family with ST status qualifies across multiple benefit programs simultaneously). You can also add family members (father, mother, children, spouse) and switch between profiles with one click.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-foreground text-background px-2 py-0.5 font-bold rounded-[2px]">
                    02
                  </span>
                  <CardTitle className="text-base font-bold text-foreground">
                    Deterministic 3-Valued Kleene Logic (AI Never Invents Rules)
                  </CardTitle>
                </div>
                <Scale className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                We use Google Gemini AI strictly for natural language dialogue and fact extraction in English and Bengali. <strong>Generative AI is strictly forbidden from deciding eligibility or inventing rules</strong>.
              </p>
              <p>
                Eligibility is evaluated by a mathematical 3-valued rule engine (Kleene logic) that tests your facts against official government gazette rules. Each rule produces an auditable trace: PASS, FAIL, or UNKNOWN (Needs More Information) with explicit official citations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-foreground text-background px-2 py-0.5 font-bold rounded-[2px]">
                    03
                  </span>
                  <CardTitle className="text-base font-bold text-foreground">
                    Eligibility Separated from Document Readiness
                  </CardTitle>
                </div>
                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                Meeting eligibility criteria is distinct from having all application paperwork ready. You may fully qualify for a scholarship or business loan but lack an updated caste or income certificate.
              </p>
              <p>
                PRAPTI explicitly highlights which schemes you qualify for and lists the exact missing documents you must procure to submit your claim, with direct links to official application portals.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-foreground text-background px-2 py-0.5 font-bold rounded-[2px]">
                    04
                  </span>
                  <CardTitle className="text-base font-bold text-foreground">
                    Privacy by Design: No Documents or Identity Numbers Stored
                  </CardTitle>
                </div>
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>
                PRAPTI <strong>never collects, requests, or stores your Aadhaar number, PAN, voter ID, or document scans</strong>.
              </p>
              <p>
                We only track whether a document is available as a private boolean readiness status. You retain complete sovereignty over your data with one-click cryptographic JSON exports and instant account deletion.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg shadow-sm">
          <div>
            <h3 className="font-bold text-sm text-foreground">Ready to discover your eligible benefits?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Takes less than 3 minutes to evaluate against 36 verified Central and State schemes.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="bg-foreground text-background px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors whitespace-nowrap rounded-[3px]"
          >
            Create Citizen Profile →
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-card/40">
        PRAPTI // Transparent Citizen Welfare Discovery &amp; Deterministic Rules Engine
      </footer>
    </div>
  );
}
