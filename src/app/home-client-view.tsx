'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ShieldCheck,
  Users,
  Scale,
  ChevronRight,
  Utensils,
  BookOpen,
  Sprout,
  Heart,
  Landmark,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/context';

export function HomeClientView({ user }: { user: { id: string } | null }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-mono antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Top Navigation */}
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
            <Link href="/" className="font-mono text-base font-bold tracking-tight">
              PRAPTI
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
            <Link href="#features" className="hover:text-foreground transition-colors">
              {t('nav.features')}
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              {t('nav.howItWorks')}
            </Link>
            <Link href="/explore" className="hover:text-foreground transition-colors">
              {t('nav.schemes')}
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              {t('nav.about')}
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-[3px] bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm flex items-center gap-1.5"
              >
                {t('nav.dashboard')} →
              </Link>
            ) : (
              <div className="flex items-center gap-2.5 sm:gap-4">
                <Link
                  href="/sign-in"
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hidden sm:block font-bold px-1"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-[3px] bg-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section: fills the screen neatly so second pane doesn't peek awkwardly */}
        <section className="min-h-[calc(100vh-64px)] flex flex-col justify-center mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Clean Sober Monospace Headline & Description */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1">
                <h1 className="font-mono text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
                  {t('hero.title')}
                </h1>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                  {t('hero.subtitle')}
                </p>
              </div>

              <p className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t('hero.description')}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="rounded-[3px] bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm inline-flex items-center gap-2"
                  >
                    {t('hero.goToDashboard')}
                  </Link>
                ) : (
                  <Link
                    href="/sign-up"
                    className="rounded-[3px] bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shadow-sm"
                  >
                    {t('hero.getStarted')}
                  </Link>
                )}
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-foreground font-semibold hover:underline"
                >
                  {t('hero.seeHowItWorks')} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Status Pill Telemetry */}
              <div className="pt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <div className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-foreground">{t('hero.badgeSchemes')}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-foreground">{t('hero.badgeNoDocs')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: India ASCII Art (inverts to crisp white in dark mode) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <Image
                src="/india_ascii.png"
                alt="India ASCII Art"
                width={1286}
                height={1223}
                priority
                className="w-full max-w-md lg:max-w-lg h-auto object-contain select-none pointer-events-none dark:invert dark:brightness-125"
              />
            </div>
          </div>
        </section>

        {/* Informative Architecture Grid */}
        <section id="features" className="border-t border-border bg-card/40 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                  {t('features.sectionTag')}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-foreground">
                  {t('features.title')}
                </h2>
              </div>
              <Link
                href="/explore"
                className="text-xs uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                {t('features.exploreSchemes')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-lg border border-border bg-card p-6 space-y-3 hover:border-foreground/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                    {t('features.card1Tag')}
                  </span>
                  <Users className="h-4 w-4 text-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">{t('features.card1Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('features.card1Desc')}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 space-y-3 hover:border-foreground/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                    {t('features.card2Tag')}
                  </span>
                  <Scale className="h-4 w-4 text-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground">{t('features.card2Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('features.card2Desc')}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-6 space-y-3 hover:border-foreground/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                    {t('features.card3Tag')}
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-foreground">{t('features.card3Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('features.card3Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Seeded Schemes Strip */}
        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/80 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                  {t('registry.sectionTag')}
                </span>
                <h2 className="text-xl font-bold text-foreground mt-0.5">
                  {t('registry.title')}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('registry.subtitle')}
                </p>
              </div>
              <Link
                href="/explore"
                className="text-xs uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1 font-semibold"
              >
                {t('features.exploreSchemes')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {[
                {
                  code: 'RJ-ANNAPURNA',
                  name: 'Annapurna Bhandar & Rasoi Yojana',
                  bn: 'অন্নপূর্ণা ভাণ্ডার ও রসুই যোজনা',
                  benefit: '₹8 nutritious meal + Subsidized packaged grocery staples',
                  dept: 'Food & Civil Supplies, Rajasthan',
                  icon: Utensils,
                  state: 'Rajasthan',
                },
                {
                  code: 'WB-ANNAPURNA',
                  name: 'Khadya Sathi - Annapurna Senior Scheme',
                  bn: 'খাদ্য সাথী - অন্নপূর্ণা প্রবীণ প্রকল্প',
                  benefit: 'Free 10 kg food grains monthly for senior citizens (65+)',
                  dept: 'Food & Supplies, West Bengal',
                  icon: Utensils,
                  state: 'West Bengal',
                },
                {
                  code: 'MH-LADKI-BAHIN',
                  name: 'Majhi Ladki Bahin Yojana',
                  bn: 'মাঝি লাডকি বহিন যোজনা',
                  benefit: '₹1,500 monthly direct bank transfer for women',
                  dept: 'Women & Child Development, Maharashtra',
                  icon: Heart,
                  state: 'Maharashtra',
                },
                {
                  code: 'KA-GRUHA-LAXMI',
                  name: 'Gruha Lakshmi Scheme',
                  bn: 'গৃহ লক্ষ্মী প্রকল্প',
                  benefit: '₹2,000 monthly for woman head of household',
                  dept: 'Women & Child Development, Karnataka',
                  icon: Landmark,
                  state: 'Karnataka',
                },
                {
                  code: 'IN-PM-KISAN',
                  name: 'PM-KISAN Samman Nidhi',
                  bn: 'প্রধানমন্ত্রী কিষাণ সম্মান নিধি',
                  benefit: '₹6,000 annually in 3 installments for farmer families',
                  dept: 'Ministry of Agriculture, India',
                  icon: Sprout,
                  state: 'Central Scheme',
                },
                {
                  code: 'WB-SVMCM',
                  name: 'Swami Vivekananda Merit-cum-Means',
                  bn: 'স্বামী বিবেকানন্দ স্কলারশিপ',
                  benefit: '₹12,000 to ₹60,000 / year for higher education',
                  dept: 'Higher Education Department, WB',
                  icon: BookOpen,
                  state: 'West Bengal',
                },
              ].map((s) => {
                const IconComponent = s.icon;
                return (
                  <div
                    key={s.code}
                    className="rounded-lg border border-border bg-card p-4 space-y-2 hover:border-foreground transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground uppercase">{s.state}</span>
                      <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="font-bold text-foreground text-sm line-clamp-1">{s.name}</p>
                    <p className="font-bengali text-xs text-muted-foreground">{s.bn}</p>
                    <div className="rounded bg-muted/50 p-2 text-[11px] font-medium text-foreground">
                      {s.benefit}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prominent See More Schemes Button */}
            <div className="pt-2 text-center">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-[3px] border border-border bg-card px-6 py-3 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-all shadow-sm"
              >
                {t('registry.exploreAll')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-card/60 py-8 text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-foreground">PRAPTI</span>
            <span>{'//'}</span>
            <span>YOUR BENEFITS. YOUR RIGHTS. YOUR CLAIM.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-wider">
            <Link href="/about" className="hover:text-foreground">
              {t('nav.about')}
            </Link>
            <Link href="/how-it-works" className="hover:text-foreground">
              {t('nav.howItWorks')}
            </Link>
            <Link href="/explore" className="hover:text-foreground">
              {t('nav.explore')}
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
