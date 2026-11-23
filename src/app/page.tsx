import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck2,
  Scale,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  let user = null;
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-mono antialiased selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* Geometric pixel icon matching demo */}
            <div className="flex items-center gap-0.5 text-foreground">
              <span className="inline-block h-3.5 w-3.5 bg-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
                <span className="inline-block h-1.5 w-1.5 bg-foreground" />
              </div>
            </div>
            <Link href="/" className="font-pixel text-base font-bold tracking-tight">
              PRAPTI
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Schemes
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/app/dashboard"
                className="rounded-[3px] bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm flex items-center gap-1.5"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="rounded-[3px] bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section matching Demo Layout */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Pixel Headline & Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1">
                <h1 className="font-pixel text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.08]">
                  PRAPTI
                  <br />
                  AI AGENT
                </h1>
              </div>

              <p className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                Your personal citizen benefits companion, helping you and your family discover verified government schemes, understand eligibility, and prepare claims with zero identity number collection.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <Link
                    href="/app/dashboard"
                    className="rounded-[3px] bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <Link
                    href="/auth/sign-up"
                    className="rounded-[3px] bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm"
                  >
                    Get Started
                  </Link>
                )}
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-foreground font-semibold hover:underline"
                >
                  See How It Works <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Status Pill Telemetry */}
              <div className="pt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <div className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>17 VERIFIED SCHEMES // CENTRAL & STATE</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1">
                  <ShieldCheck className="h-3 w-3 text-foreground" />
                  <span>ZERO AADHAAR NUMBERS STORED</span>
                </div>
              </div>
            </div>

            {/* Right Column: India ASCII Art */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <Image
                src="/india_ascii.png"
                alt="India ASCII Art"
                width={1286}
                height={1223}
                priority
                className="w-full max-w-md lg:max-w-lg h-auto object-contain select-none pointer-events-none"
              />
            </div>
          </div>
        </section>

        {/* Informative Architecture Grid */}
        <section id="features" className="border-t border-border bg-card/40 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {'//'} CORE ARCHITECTURE
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-foreground">
                  Deterministic Eligibility & Privacy by Design
                </h2>
              </div>
              <Link
                href="/explore"
                className="text-xs uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Explore Catalogue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                  01 // PROFILE-DRIVEN
                </div>
                <h3 className="text-base font-bold text-foreground">Multi-Characteristic Matching</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Citizens belong to overlapping groups. A female college student from a farming household qualifies across student, women, and rural benefit categories simultaneously.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                  02 // DETERMINISTIC RULES
                </div>
                <h3 className="text-base font-bold text-foreground">Kleene 3-Valued Logic Engine</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generative AI is strictly forbidden from inventing rules or deciding eligibility. Rules evaluate to PASS, FAIL, or UNKNOWN with complete audit traces and gazette citations.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                  03 // PRIVACY SAFEGUARDS
                </div>
                <h3 className="text-base font-bold text-foreground">Zero ID Numbers Collected</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PRAPTI never asks for Aadhaar numbers, PAN, or voter ID strings. Document availability is tracked as readiness flags, preserving citizen dignity and data safety.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Seeded Schemes Strip */}
        <section className="border-t border-border py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {'//'} VERIFIED REGISTRY
                </span>
                <h2 className="text-lg font-bold text-foreground mt-0.5">
                  Initial Launch Schemes (West Bengal & Central)
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">100% Verified Sources</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                {
                  code: 'WB-K2',
                  name: 'Kanyashree Prakalpa (K2)',
                  bn: 'কন্যাশ্রী প্রকল্প',
                  benefit: '₹25,000 one-time grant',
                  dept: 'Women & Child Dev, WB',
                },
                {
                  code: 'WB-SVMCM',
                  name: 'Swami Vivekananda Scholarship',
                  bn: 'স্বামী বিবেকানন্দ স্কলারশিপ',
                  benefit: '₹12,000 - ₹60,000 / year',
                  dept: 'Higher Education Dept, WB',
                },
                {
                  code: 'WB-KB',
                  name: 'Krishak Bandhu (Natun)',
                  bn: 'কৃষক বন্ধু (নতুন)',
                  benefit: 'Up to ₹10,000/yr + ₹2L insurance',
                  dept: 'Dept of Agriculture, WB',
                },
                {
                  code: 'WB-LB',
                  name: 'Lakshmir Bhandar',
                  bn: 'লক্ষ্মীর ভাণ্ডার',
                  benefit: '₹1,000 - ₹1,200 monthly',
                  dept: 'Women & Child Dev, WB',
                },
                {
                  code: 'WB-YS',
                  name: 'Yuvasree Assistance',
                  bn: 'যুবশ্রী সহায়তা',
                  benefit: '₹1,500 monthly stipend',
                  dept: 'Labour Department, WB',
                },
                {
                  code: 'IN-PMK',
                  name: 'PM-KISAN Samman Nidhi',
                  bn: 'প্রধানমন্ত্রী কিষাণ নিধি',
                  benefit: '₹6,000 annually in 3 terms',
                  dept: 'Ministry of Agriculture, India',
                },
              ].map((s) => (
                <div
                  key={s.code}
                  className="rounded border border-border bg-card p-3.5 space-y-1.5 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{s.code}</span>
                    <span>{s.dept}</span>
                  </div>
                  <p className="font-bold text-foreground text-sm">{s.name}</p>
                  <p className="font-bengali text-xs text-muted-foreground">{s.bn}</p>
                  <div className="rounded bg-muted/40 p-1.5 text-[11px] font-medium text-foreground">
                    {s.benefit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-card/60 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs font-bold text-foreground">PRAPTI</span>
            <span>{'//'}</span>
            <span>YOUR BENEFITS. YOUR RIGHTS. YOUR CLAIM.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              How It Works
            </Link>
            <Link href="/explore" className="hover:text-foreground">
              Explore
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
