import Link from 'next/link';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Globe,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  FileCheck2,
  RefreshCw,
  GitBranch,
  Mail,
  Github,
} from 'lucide-react';

export const metadata = {
  title: 'Future Expansion & Roadmap | Prapti',
  description:
    'Upcoming regional languages, autonomous scheme retrieval & verification pipelines, and architecture roadmap for Prapti.',
};

export default async function FutureExpansionPage() {
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

  const upcomingLanguages = [
    {
      name: 'Odia',
      native: 'ଓଡ଼ିଆ',
      region: 'Odisha',
      schemes: 'Biju Swasthya Kalyan, Kalia Yojana, Subhadra Yojana',
      stage: 'Linguistic Dataset Tuning',
      badge: 'Q1 2027',
    },
    {
      name: 'Assamese',
      native: 'অসমীয়া',
      region: 'Assam & North East',
      schemes: 'Orunodoi 3.0, Pragyan Bharati, Mukhya Mantri Lok Sevak',
      stage: 'Corpus Benchmark',
      badge: 'Q1 2027',
    },
    {
      name: 'Telugu',
      native: 'తెలుగు',
      region: 'Andhra Pradesh & Telangana',
      schemes: 'Rythu Bharosa, Cheyutha, Aarogyasri, Mahalakshmi',
      stage: 'Rule Parsing Pipeline',
      badge: 'Q2 2027',
    },
    {
      name: 'Tamil',
      native: 'தமிழ்',
      region: 'Tamil Nadu',
      schemes: 'Kalaignar Magalir Urimai Thogai, Pudhumai Penn, Moovalur',
      stage: 'Rule Grammar Validation',
      badge: 'Q2 2027',
    },
    {
      name: 'Kannada',
      native: 'ಕನ್ನಡ',
      region: 'Karnataka',
      schemes: 'Gruha Lakshmi, Yuva Nidhi, Shakti, Gruha Jyothi',
      stage: 'Validation Staging',
      badge: 'Q2 2027',
    },
    {
      name: 'Malayalam',
      native: 'മലയാളം',
      region: 'Kerala',
      schemes: 'Karunya Arogya Suraksha, Social Security Pension Schemes',
      stage: 'Corpus Compilation',
      badge: 'Q3 2027',
    },
    {
      name: 'Gujarati',
      native: 'ગુજરાતી',
      region: 'Gujarat',
      schemes: 'Mukhyamantri Kisan Sahay, Vhali Dikri Yojana, Vidhyadeep',
      stage: 'Dataset Collection',
      badge: 'Q3 2027',
    },
    {
      name: 'Punjabi',
      native: 'ਪੰਜਾਬੀ',
      region: 'Punjab & Chandigarh',
      schemes: 'Smart Ration Card, Ashirwad Scheme, Mukh Mantri Tirath Yatra',
      stage: 'Corpus Benchmark',
      badge: 'Q3 2027',
    },
    {
      name: 'Bhojpuri & Maithili',
      native: 'भोजपुरी / मैथिली',
      region: 'Bihar & Eastern UP',
      schemes: 'Mukhyamantri Kanya Utthan, Saat Nischay, Balika Protsahan',
      stage: 'Dialect Tokenizer Tuning',
      badge: 'Q4 2027',
    },
    {
      name: 'Santhali (Ol Chiki)',
      native: 'ᱚᱞ ᱪᱤᱠᱤ',
      region: 'Tribal Belt (Jharkhand, WB, Odisha)',
      schemes: 'Marang Gomke Overseas, Birsa Harit Gram, Vanbandhu',
      stage: 'Indigenous Script Corpus Pipeline',
      badge: 'Q4 2027',
    },
  ];

  const retrievalFeatures = [
    {
      title: 'Automated State Gazette Crawlers & Continuous Ingestion',
      desc: 'Autonomous scheduled crawlers monitoring state e-gazettes, legislative circulars, and Press Information Bureau (PIB) bulletins to ingest amendments and newly launched welfare schemes within 24 hours of notification.',
      tag: 'INGESTION ENGINE',
    },
    {
      title: 'Multi-Hop Kleene Logic Rule Extraction',
      desc: 'Self-improving neuro-symbolic parser that translates government orders (GOs) and complex eligibility paragraphs into deterministic 3-valued (True, False, Unknown) logic trees with verifiable clause citations.',
      tag: 'DETERMINISTIC VERIFICATION',
    },
    {
      title: 'Tamper-Evident Versioning & Cryptographic Audit Trails',
      desc: 'Immutable version control on all scheme qualification rules, benefit criteria, and document requirements. Every edit creates an auditable commit hash with mandatory reviewer sign-off to prevent bias or hallucination.',
      tag: 'INTEGRITY GUARANTEE',
    },
    {
      title: 'Real-Time State Scheme API Cross-Verification',
      desc: 'Direct synchronization connectors with official digital infrastructures including West Bengal Duare Sarkar / Banglar Shiksha, Rajasthan Jan Soochna, and national myScheme API.',
      tag: 'LIVE CONNECTORS',
    },
  ];

  const extraRoadmap = [
    {
      icon: MessageSquare,
      title: 'WhatsApp & Telegram Low-Bandwidth Chatbot Bridge',
      desc: 'Direct accessibility via popular messaging channels. Citizens in rural areas with low mobile data can chat in plain dialect or send voice notes to receive instantly evaluated entitlements.',
    },
    {
      icon: Cpu,
      title: 'Offline-First Village Kiosk Mode with Mesh Synchronization',
      desc: 'A standalone offline Progressive Web App for Gram Panchayat workers and Duare Sarkar camp volunteers, maintaining local SQLite cache and automatically batch-syncing when network connectivity is found.',
    },
    {
      icon: FileCheck2,
      title: 'Automated DigiLocker Integration & Local Document OCR',
      desc: 'Zero-knowledge, 1-click document import from DigiLocker alongside device-side OCR extraction for income certificates, caste certificates, and land record porchas without uploading raw citizen credentials.',
    },
    {
      icon: RefreshCw,
      title: 'Inter-State Migrant Worker Benefit Portability',
      desc: 'Intelligent tracking of portable rights (One Nation One Ration Card, BOCW welfare board portability, Ayushman Bharat inter-state portability) when a beneficiary relocates across states.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
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
              {'//'} Roadmap &amp; Future Expansion
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Schemes
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/future-expansion" className="text-foreground font-bold border-b border-foreground">
              Future Expansion
            </Link>
            <a
              href="https://github.com/Rijurajx/prapti"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/demo"
              className="rounded-full border border-foreground/40 bg-muted/40 hover:bg-foreground hover:text-background px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider transition-all shadow-sm shrink-0"
            >
              View Demo
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-foreground text-background px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
              >
                Dashboard →
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-4">
                <Link
                  href="/sign-in"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block px-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-foreground text-background px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors rounded-[3px]"
                >
                  Get Started →
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Roadmap Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 space-y-12">
        {/* Header Hero */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-muted/60 text-foreground text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Architecture Roadmap &amp; Horizons</span>
          </div>
          <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            FUTURE EXPANSION
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            We are actively expanding Prapti into an autonomous, pan-India entitlement infrastructure — scaling multilingual accessibility, autonomous gazette verification, and decentralized rural connectivity.
          </p>
        </div>

        {/* Section 1: Multilingual Support & Regional Languages */}
        <section className="space-y-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-foreground" />
              <h2 className="font-mono text-lg sm:text-xl font-bold text-foreground">
                1. Multilingual Support &amp; Upcoming Regional Languages
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We are working on comprehensive multilingual support and expanding beyond English, Bengali, Hindi, and Marathi to include all major regional and tribal languages of India. Below is our active pipeline of upcoming regional language engines:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingLanguages.map((lang) => (
              <div
                key={lang.name}
                className="rounded-lg border border-border bg-card p-4 space-y-2.5 hover:border-foreground/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-foreground">{lang.name}</span>
                    <span className="text-xs text-muted-foreground font-semibold">({lang.native})</span>
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-foreground uppercase tracking-tight">
                    {lang.badge}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">Region:</strong> {lang.region}
                  </p>
                  <p>
                    <strong className="text-foreground">Target Schemes:</strong> {lang.schemes}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Pipeline Status: {lang.stage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 text-xs space-y-2">
            <p className="font-bold text-foreground uppercase tracking-wider font-mono">
              {'//'} Indic Conversational Voice Recognition
            </p>
            <p className="text-muted-foreground leading-relaxed">
              In addition to text translations, Prapti is integrating speech-to-text models through Bhashini AI and open Indic-Whisper pipelines. Non-literate rural citizens will be able to speak their circumstances in their village dialect and receive audible synthesized benefit recommendations.
            </p>
          </div>
        </section>

        {/* Section 2: Scheme Retrieval & Verification Pipeline */}
        <section className="space-y-6 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-mono text-lg sm:text-xl font-bold text-foreground">
                2. Autonomous Scheme Retrieval &amp; Verification Process
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ensuring zero hallucinations and complete fidelity to official government gazettes requires deterministic, multi-hop retrieval pipelines:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {retrievalFeatures.map((feat) => (
              <div
                key={feat.title}
                className="rounded-lg border border-border bg-card p-5 space-y-2 hover:border-foreground/40 transition-colors"
              >
                <span className="text-[10px] font-mono font-black tracking-widest text-muted-foreground uppercase">
                  {'//'} {feat.tag}
                </span>
                <h3 className="font-mono text-sm font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Additional Horizons */}
        <section className="space-y-6 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-foreground" />
              <h2 className="font-mono text-lg sm:text-xl font-bold text-foreground">
                3. Last-Mile Delivery &amp; Civic Integration Horizons
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bridging the gap between software platforms and rural grass-roots execution:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {extraRoadmap.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-lg border border-border bg-card p-5 space-y-2 hover:border-foreground/40 transition-colors"
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <IconComp className="h-4 w-4" />
                    <h3 className="font-mono text-sm font-bold">{item.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact & Collaborative Call to Action */}
        <div className="rounded-lg border border-foreground bg-card p-6 sm:p-8 space-y-4 text-center">
          <h2 className="font-mono text-xl sm:text-2xl font-bold text-foreground">
            Collaborate on Prapti&apos;s Entitlement Engine
          </h2>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Are you a state welfare researcher, civic tech developer, or linguist? We welcome contributors to help verify scheme clauses, build dialect corpora, and expand regional support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="mailto:rijurajdatta8@gmail.com"
              className="rounded-[3px] bg-foreground px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Us: rijurajdatta8@gmail.com</span>
            </a>
            <a
              href="https://github.com/Rijurajx/prapti"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[3px] border border-border bg-card px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:bg-muted transition-all inline-flex items-center gap-1.5"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">PRAPTI</span>
            <span>{'//'}</span>
            <span>TRANSPARENT CITIZEN WELFARE DISCOVERY</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              How It Works
            </Link>
            <Link href="/explore" className="hover:text-foreground">
              Schemes
            </Link>
            <Link href="/future-expansion" className="hover:text-foreground font-bold text-foreground">
              Future Expansion
            </Link>
            <a
              href="mailto:rijurajdatta8@gmail.com"
              className="rounded-[3px] border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
