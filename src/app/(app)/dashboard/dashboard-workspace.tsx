'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Sparkles,
  Search,
  Bookmark,
  Clock,
  Bell,
  User,
  GraduationCap,
  Briefcase,
  Sprout,
  FolderLock,
  Bot,
  BookOpen,
  HelpCircle,
  Users,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Menu,
  X,
  FileText,
  Calendar,
  Trash2,
  Check,
  Plus,
  Loader2,
} from 'lucide-react';
import { triggerPageLoading } from '@/components/route-progress-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { signOut } from '@/app/(auth)/actions';
import { toggleEnrollScheme } from '@/app/schemes/actions';
import { OpportunityCard } from '@/app/opportunities/opportunity-card';
import { ClaimCard } from '@/app/applications/claim-card';
import { RemindersView } from '@/app/reminders/reminders-view';
import { AssistantChat } from '@/app/assistant/assistant-chat';
import { ExportDataButton } from '@/app/privacy/export-data-button';
import { PersonalDetailsForm } from '@/app/profile/personal/personal-form';
import { AddressForm } from '@/app/profile/address/address-form';
import { FinanceForm } from '@/app/profile/finance/finance-form';
import { AssetForm } from '@/app/profile/finance/asset-form';
import { EmploymentForm } from '@/app/profile/employment/employment-form';
import { EducationManager } from '@/app/profile/education/education-manager';
import { AgricultureForm } from '@/app/profile/agriculture/agriculture-form';
import { DocumentsForm, type DocumentRow } from '@/app/profile/documents/documents-form';
import { CreateHouseholdForm } from '@/app/household/household-forms';
import { updateUserSettings } from '@/app/settings/actions';
import { FamilyMembersView, type FamilyMemberItem } from '@/app/family/family-members-view';
import { switchActiveProfile } from '@/app/family/actions';
import { CategoryTagsSelector } from '@/app/profile/tags-selector';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { PraptiLogo } from '@/components/prapti-logo';
import { useTranslation } from '@/lib/i18n/context';
import type { PersonalizedOpportunities } from '@/services/matching';

interface NavSubItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
  badgeTone?: 'neutral' | 'success' | 'warning' | 'info';
}

interface NavCategory {
  id: string;
  title: string;
  items: NavSubItem[];
}

interface DashboardWorkspaceProps {
  user: { id: string; email?: string; full_name?: string; preferred_language?: string };
  activeCitizen: { id: string; name: string; relationship: string; categoryTags?: string[] };
  familyMembers: FamilyMemberItem[];
  citizenId: string;
  initialTab?: string;
  opportunities: PersonalizedOpportunities;
  schemes: any[];
  savedSchemes: any[];
  enrolledSchemes?: any[];
  claims: any[];
  reminders: any[];
  personalDetails: any;
  addresses: any;
  financialProfile: any;
  assetProfile?: any;
  employmentProfile: any;
  educationRecords: any[];
  agriculturalProfile: any;
  documentRows: DocumentRow[];
  households: any[];
}

export function DashboardWorkspace({
  user,
  activeCitizen,
  familyMembers,
  citizenId,
  initialTab = 'overview',
  opportunities,
  schemes,
  savedSchemes,
  enrolledSchemes = [],
  claims,
  reminders,
  personalDetails,
  addresses,
  financialProfile,
  assetProfile,
  employmentProfile,
  educationRecords,
  agriculturalProfile,
  documentRows,
  households,
}: DashboardWorkspaceProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [enrolledList, setEnrolledList] = useState<any[]>(enrolledSchemes);
  const [isEnrollingSchemeId, setIsEnrollingSchemeId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [schemeTagFilter, setSchemeTagFilter] = useState<string>('all');
  const [schemeStateFilter, setSchemeStateFilter] = useState<string>('all');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    overview: true,
    schemes: true,
    profile: true,
    applications: true,
    ai: true,
    family: true,
  });

  // Keep state in sync with URL without page reload
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const switchTab = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedSchemeId(null);
    setMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleSwitchMember = async (memberId: string) => {
    if (memberId === activeCitizen.id) {
      setUserDropdownOpen(false);
      return;
    }
    setSwitchingProfileId(memberId);
    triggerPageLoading();
    const res = await switchActiveProfile(memberId);
    if (res.ok) {
      window.location.reload();
    } else {
      alert(res.error || 'Failed to switch profile');
      setSwitchingProfileId(null);
    }
  };

  const handleToggleEnroll = async (schemeId: string) => {
    setIsEnrollingSchemeId(schemeId);
    try {
      const res = await toggleEnrollScheme(schemeId);
      if (res.ok) {
        if (res.isEnrolled) {
          const foundScheme = schemes.find((s) => s.id === schemeId);
          setEnrolledList((prev) => [
            {
              id: 'local-' + Date.now(),
              scheme_id: schemeId,
              created_at: new Date().toISOString(),
              schemes: foundScheme,
            },
            ...prev,
          ]);
        } else {
          setEnrolledList((prev) => prev.filter((item) => item.scheme_id !== schemeId && item.schemes?.id !== schemeId));
        }
      }
    } finally {
      setIsEnrollingSchemeId(null);
    }
  };

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const citizenState =
    addresses?.current?.state ??
    addresses?.permanent?.state ??
    (Array.isArray(addresses)
      ? addresses.find((a: any) => a.kind === 'current')?.state ?? addresses[0]?.state
      : null) ??
    null;

  const readyToApply = opportunities.likelyEligible.filter((o) => o.documentReadiness.isFullyReady);
  const actionRequiredDocs = opportunities.likelyEligible.filter((o) => !o.documentReadiness.isFullyReady);
  const relevantNeedsInfo = opportunities.needsMoreInfo.filter(
    (o) =>
      o.jurisdiction === 'central' ||
      !o.state ||
      (citizenState && o.state.toLowerCase() === citizenState.toLowerCase())
  );

  const eligibleCount = opportunities.likelyEligible.length;
  const needsInfoCount = relevantNeedsInfo.length;
  const readyDocsCount = documentRows.filter((d) => d.status === 'available').length;
  const totalDocsCount = documentRows.length;

  const userCategoryTags = (activeCitizen.categoryTags ?? []).map((t) => t.toLowerCase());

  const filteredSchemes = schemes.filter((s) => {
    const q = schemeSearchQuery.toLowerCase().trim();
    const sTags: string[] = Array.isArray(s.tags) ? s.tags : [];
    const matchesSearch =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.name_bn?.toLowerCase().includes(q) ||
      s.short_description?.toLowerCase().includes(q) ||
      s.ministry_label?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      sTags.some((t: string) => t.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // State / Jurisdiction filter
    if (schemeStateFilter === 'central') {
      if (s.jurisdiction !== 'central') return false;
    } else if (schemeStateFilter !== 'all') {
      if (!s.state || s.state.toLowerCase() !== schemeStateFilter.toLowerCase()) return false;
    }

    // Category / Tag filter
    if (schemeTagFilter === 'all') return true;
    if (schemeTagFilter === 'my_profile') {
      if (userCategoryTags.length === 0) return true;
      return sTags.some((t: string) => userCategoryTags.includes(t.toLowerCase()));
    }
    if (schemeTagFilter === 'food')
      return (
        sTags.includes('food_security') ||
        s.slug?.includes('annapurna') ||
        s.name?.toLowerCase().includes('annapurna') ||
        s.name?.toLowerCase().includes('khadya')
      );
    if (schemeTagFilter === 'student')
      return s.category === 'education' || sTags.includes('student') || sTags.includes('scholarship');
    if (schemeTagFilter === 'women')
      return s.category === 'women' || sTags.includes('women') || sTags.includes('widow') || sTags.includes('girl');
    if (schemeTagFilter === 'pension')
      return sTags.includes('elderly') || sTags.includes('retired') || sTags.includes('widow');
    if (schemeTagFilter === 'caste')
      return sTags.includes('sc') || sTags.includes('st') || sTags.includes('obc');
    if (schemeTagFilter === 'farmer')
      return s.category === 'agriculture' || sTags.includes('farmer');
    if (schemeTagFilter === 'health')
      return s.category === 'health' || sTags.includes('health') || sTags.includes('healthcare');
    if (schemeTagFilter === 'livelihood')
      return (
        sTags.includes('employed') ||
        sTags.includes('business') ||
        sTags.includes('street_vendor') ||
        sTags.includes('unemployed') ||
        sTags.includes('self_employed') ||
        s.category === 'livelihood'
      );

    return true;
  });

  const categories: NavCategory[] = [
    {
      id: 'overview',
      title: 'OVERVIEW & MATCHES',
      items: [
        { id: 'overview', label: t('dashboard.overview'), icon: LayoutDashboard },
        {
          id: 'opportunities',
          label: t('dashboard.myOpportunities'),
          icon: Sparkles,
          badge:
            readyToApply.length > 0
              ? `${readyToApply.length} READY`
              : actionRequiredDocs.length > 0
              ? `${actionRequiredDocs.length} ELIGIBLE`
              : undefined,
          badgeTone: 'success',
        },
      ],
    },
    {
      id: 'schemes',
      title: 'SCHEMES & CLAIMS',
      items: [
        { id: 'schemes', label: 'Discover Schemes', icon: Search, badge: schemes.length },
        {
          id: 'enrolled',
          label: 'Enrolled Schemes',
          icon: CheckCircle2,
          badge: enrolledList.length > 0 ? enrolledList.length : undefined,
          badgeTone: 'success',
        },
        {
          id: 'saved',
          label: t('dashboard.saved'),
          icon: Bookmark,
          badge: savedSchemes.length > 0 ? savedSchemes.length : undefined,
        },
        {
          id: 'applications',
          label: t('dashboard.claims'),
          icon: Clock,
          badge: claims.length > 0 ? claims.length : undefined,
        },
        {
          id: 'reminders',
          label: t('dashboard.reminders'),
          icon: Bell,
          badge: reminders.filter((r) => !r.is_dismissed).length || undefined,
        },
      ],
    },
    {
      id: 'profile',
      title: 'CITIZEN PROFILE',
      items: [
        { id: 'profile_personal', label: t('dashboard.personal'), icon: User },
        { id: 'profile_education', label: t('dashboard.education'), icon: GraduationCap },
        { id: 'profile_finance', label: t('dashboard.finance'), icon: Briefcase },
        { id: 'profile_agriculture', label: t('dashboard.agriculture'), icon: Sprout },
        {
          id: 'profile_documents',
          label: t('dashboard.documents'),
          icon: FolderLock,
          badge: `${readyDocsCount}/${totalDocsCount}`,
        },
      ],
    },
    {
      id: 'ai',
      title: 'AI & GUIDANCE',
      items: [
        { id: 'assistant', label: 'Prapti AI', icon: PraptiLogo },
        { id: 'guides', label: 'Certificate Guides', icon: BookOpen },
        { id: 'help', label: 'Helplines & FAQs', icon: HelpCircle },
      ],
    },
    {
      id: 'family',
      title: 'FAMILY & SETTINGS',
      items: [
        {
          id: 'family_members',
          label: t('dashboard.familyMembers'),
          icon: Users,
          badge: familyMembers.length > 1 ? `${familyMembers.length} PROFILES` : undefined,
        },
        { id: 'privacy', label: t('dashboard.privacy'), icon: ShieldCheck },
        { id: 'settings', label: t('dashboard.settings'), icon: Settings },
      ],
    },
  ];

  // Selected scheme detail object if scheme is selected
  const activeSchemeDetail = selectedSchemeId
    ? schemes.find((s) => s.id === selectedSchemeId)
    : null;

  const firstName = activeCitizen.name.split(' ')[0] ?? 'CITIZEN';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-mono">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
        }`}
      >
        {/* Brand Bar */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <span className="inline-block h-3 w-3 bg-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="inline-block h-1 w-1 bg-foreground" />
                <span className="inline-block h-1 w-1 bg-foreground" />
              </div>
            </div>
            <Link href="/" className="font-pixel text-sm font-bold tracking-tight text-foreground">
              PRAPTI
            </Link>
            <span className="text-[10px] text-muted-foreground ml-1">v1.1</span>
          </div>

          <button
            type="button"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav with Accordion Categories */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {categories.map((cat) => {
            const isOpen = openCategories[cat.id] ?? true;

            return (
              <div key={cat.id} className="space-y-1.5 pt-1">
                {/* Category Header (collapsible, prominent and darker) */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-foreground hover:text-black transition-colors rounded-sm bg-muted/30"
                >
                  <span className="font-extrabold tracking-wide">{'//'} {cat.title}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 stroke-[2.5] mr-1" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] mr-1" />
                  )}
                </button>

                {/* Sub-options */}
                {isOpen && (
                  <div className="space-y-0.5 pt-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id && !selectedSchemeId;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => switchTab(item.id)}
                          className={`flex w-full items-center justify-between px-3 py-2 text-xs font-bold rounded-[3px] transition-all text-left ${
                            isActive
                              ? 'bg-foreground text-background font-black shadow-sm'
                              : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-background' : 'text-foreground/80'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight ${
                                isActive
                                  ? 'bg-background text-foreground'
                                  : item.badgeTone === 'success'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Footer in Sidebar */}
        <div className="border-t border-border p-3 bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
              <span className="truncate text-xs font-semibold text-foreground" title={user.full_name || 'Citizen'}>
                {user.full_name || 'Citizen'}
              </span>
            </div>
            <form
              action={signOut}
              onSubmit={() => {
                setIsSigningOut(true);
                triggerPageLoading();
              }}
              className="shrink-0"
            >
              <button
                type="submit"
                disabled={isSigningOut}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                title="Sign out of Prapti"
              >
                {isSigningOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600 dark:text-rose-400" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Redesigned Header with Mobile-Optimized Layout */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-sm px-2.5 sm:px-6">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden text-foreground hover:text-muted-foreground p-1 shrink-0"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Monospace telemetry breadcrumb */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground min-w-0">
              <span className="hidden sm:inline font-bold text-foreground">PRAPTI</span>
              <span className="hidden sm:inline">{'//'}</span>
              <span className="font-semibold text-foreground uppercase truncate max-w-[85px] sm:max-w-none">
                {selectedSchemeId
                  ? 'SCHEME_INSPECTOR'
                  : activeTab.replace('profile_', 'PROFILE_').replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3.5 md:gap-4.5 text-xs shrink-0">
            {/* Live Eligibility Badge (desktop only to prevent mobile cramping) */}
            {eligibleCount > 0 && (
              <button
                type="button"
                onClick={() => switchTab('opportunities')}
                className="hidden md:inline-flex items-center gap-1.5 rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {eligibleCount} LIKELY ELIGIBLE
              </button>
            )}

            {/* Highlighted Solid Black Family Profile Dropdown - Mobile Optimized */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="bg-foreground text-background font-mono font-bold text-[11px] sm:text-xs uppercase px-2 py-1 sm:px-3 sm:py-1.5 rounded-[3px] flex items-center gap-1 hover:bg-black/90 dark:hover:bg-white/90 dark:hover:text-black transition-colors shadow-sm cursor-pointer border border-foreground"
                title="Switch Beneficiary Profile"
              >
                <User className="h-3.5 w-3.5 shrink-0" />
                {/* Mobile version: compact first name */}
                <span className="inline sm:hidden truncate max-w-[65px] font-bold">
                  {firstName}
                </span>
                {/* Desktop version: full [USER: NAME (RELATION)] */}
                <span className="hidden sm:inline truncate max-w-[140px] sm:max-w-[240px]">
                  [USER: {activeCitizen.name.toUpperCase()} ({activeCitizen.relationship.toUpperCase()})]
                </span>
                <ChevronDown
                  className={`h-3 w-3 shrink-0 transition-transform duration-150 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 z-[9999] w-64 sm:w-72 border-2 border-foreground bg-card p-2 shadow-2xl font-mono text-xs">
                    <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
                      {'//'} {t('dashboard.switchBeneficiary')}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {familyMembers.map((m) => {
                        const isActive = m.id === activeCitizen.id;
                        const isSwitching = switchingProfileId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={isSwitching}
                            onClick={() => handleSwitchMember(m.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-sm transition-colors ${
                              isActive
                                ? 'bg-foreground text-background font-bold'
                                : 'hover:bg-muted text-foreground'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="font-bold truncate">{m.name}</span>
                              <span
                                className={`text-[10px] uppercase font-semibold ${
                                  isActive ? 'text-background/80' : 'text-muted-foreground'
                                }`}
                              >
                                ({m.relationship})
                              </span>
                            </div>
                            {isActive && <Check className="h-4 w-4 shrink-0" />}
                            {isSwitching && (
                              <span className="text-[10px] animate-pulse">Switching...</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border pt-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          switchTab('family_members');
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted rounded-sm transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Add Family Member</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic Main Pane (SPA component loader without page reload) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* 1. If Scheme Detail is selected, show in-pane inspector */}
          {activeSchemeDetail ? (
            <div className="space-y-6 max-w-4xl">
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedSchemeId(null)}
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  ← Back to schemes directory
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                    <Badge tone="neutral">
                      {activeSchemeDetail.jurisdiction === 'central'
                        ? 'Central Scheme'
                        : activeSchemeDetail.state ?? 'West Bengal'}
                    </Badge>
                    <span>•</span>
                    <span className="capitalize">{activeSchemeDetail.category}</span>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">
                    {activeSchemeDetail.name}
                  </h1>
                  {activeSchemeDetail.name_bn && (
                    <p className="font-bengali text-base text-muted-foreground mt-0.5">
                      {activeSchemeDetail.name_bn}
                    </p>
                  )}
                  {activeSchemeDetail.ministry_label && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeSchemeDetail.ministry_label}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleEnroll(activeSchemeDetail.id)}
                    disabled={isEnrollingSchemeId === activeSchemeDetail.id}
                    className={`h-9 text-xs font-mono font-bold transition-colors ${
                      enrolledList.some(
                        (e) =>
                          e.scheme_id === activeSchemeDetail.id ||
                          e.schemes?.id === activeSchemeDetail.id,
                      )
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {enrolledList.some(
                      (e) =>
                        e.scheme_id === activeSchemeDetail.id ||
                        e.schemes?.id === activeSchemeDetail.id,
                    ) ? (
                      <>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Already Getting</span>
                      </>
                    ) : (
                      <>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        <span>Already Getting?</span>
                      </>
                    )}
                  </Button>

                  {activeSchemeDetail.portal_url && (
                    <a
                      href={activeSchemeDetail.portal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[3px] bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background hover:bg-foreground/90 transition-all shrink-0"
                    >
                      Official Portal <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {activeSchemeDetail.short_description && (
                <div className="rounded border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed">
                  {activeSchemeDetail.short_description}
                </div>
              )}
            </div>
          ) : activeTab === 'overview' ? (
            /* =========================================================================
               TAB: OVERVIEW
            ========================================================================= */
            <div className="space-y-6 max-w-5xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Citizen Benefits Workspace
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Deterministic scheme matching based on verified government rules and your personal circumstances.
                </p>
              </div>

              {eligibleCount > 0 && (
                <div className="rounded border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-foreground" />
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          {eligibleCount} Likely Eligible {eligibleCount === 1 ? 'Scheme' : 'Schemes'} Discovered
                        </p>
                        <p className="text-xs text-muted-foreground">
                          All published criteria met against your recorded facts.
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => switchTab('opportunities')}>
                      View Opportunities <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <Card className="hover:border-foreground transition-colors cursor-pointer" onClick={() => switchTab('opportunities')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Eligible Matches</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{eligibleCount}</div>
                    <p className="text-muted-foreground mt-1">
                      {needsInfoCount > 0 ? `+${needsInfoCount} need more details` : 'Criteria satisfied'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:border-foreground transition-colors cursor-pointer" onClick={() => switchTab('profile_documents')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Document Readiness</span>
                      <FolderLock className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{readyDocsCount}</div>
                    <p className="text-muted-foreground mt-1">
                      {readyDocsCount} of {totalDocsCount} documents available
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:border-foreground transition-colors cursor-pointer" onClick={() => switchTab('applications')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Tracked Claims</span>
                      <Clock className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{claims.length}</div>
                    <p className="text-muted-foreground mt-1">
                      {claims.length === 0 ? 'No active claims' : 'In preparation / submitted'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:border-foreground transition-colors cursor-pointer" onClick={() => switchTab('reminders')}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Reminders</span>
                      <Bell className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {reminders.filter((r) => !r.is_dismissed).length}
                    </div>
                    <p className="text-muted-foreground mt-1">Pending deadlines & follow-ups</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Launchpad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-bold">Profile Readiness</CardTitle>
                    <CardDescription className="text-xs">
                      Keep your facts up to date to ensure accurate deterministic evaluation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {[
                      { label: 'Personal & Age Details', done: Boolean(personalDetails?.dateOfBirth), tab: 'profile_personal' },
                      { label: 'Residential Domicile', done: Boolean(addresses?.current?.state), tab: 'profile_personal' },
                      { label: 'Family Annual Income', done: Boolean(financialProfile?.family_annual_income_inr), tab: 'profile_finance' },
                      {
                        label: 'Owned Assets & Property',
                        done: Boolean(
                          assetProfile?.ownsHouse ||
                          assetProfile?.ownsTwoWheeler ||
                          assetProfile?.ownsFourWheeler ||
                          assetProfile?.ownsLand ||
                          assetProfile?.houseType
                        ),
                        tab: 'profile_finance',
                      },
                      { label: 'Education Records', done: educationRecords.length > 0, tab: 'profile_education' },
                      { label: 'Document Inventory', done: readyDocsCount > 0, tab: 'profile_documents' },
                    ].map((step) => (
                      <div key={step.label} className="flex items-center justify-between p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          {step.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>
                            {step.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => switchTab(step.tab)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {step.done ? 'Edit' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <PraptiLogo className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">Prapti AI</CardTitle>
                        <CardDescription className="text-xs">
                          Context-aware assistant for government benefits and eligibility
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      Ask why you qualify or why you are not eligible, discover required certificates, or tell Prapti AI your story in your language.
                    </p>
                    <Button size="sm" onClick={() => switchTab('assistant')} className="gap-1.5">
                      <PraptiLogo className="h-3.5 w-3.5" /> Prapti AI →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : activeTab === 'opportunities' ? (
            /* =========================================================================
               TAB: OPPORTUNITIES
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    My Opportunities
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Direct matches for {activeCitizen.name} based on gender, state ({citizenState ?? 'All India'}), and profile category tags.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {readyToApply.length > 0 && (
                    <Badge tone="success">
                      {readyToApply.length} Ready to Apply
                    </Badge>
                  )}
                  {actionRequiredDocs.length > 0 && (
                    <Badge tone="warning">
                      {actionRequiredDocs.length} Need Documents
                    </Badge>
                  )}
                </div>
              </div>

              {readyToApply.length === 0 && actionRequiredDocs.length === 0 && relevantNeedsInfo.length === 0 ? (
                <div className="rounded border border-border p-8 text-center space-y-3 bg-card">
                  <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">No eligible scheme matches found yet</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Ensure your address/state, category tags (e.g. Student, Widow, Farmer, Employed, SC/ST, Elder), and family income are up to date.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button size="sm" onClick={() => switchTab('profile_tags')}>
                      Select Category Tags
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => switchTab('profile_address')}>
                      Set Location / State
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Section 1: Ready to Apply */}
                  {readyToApply.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <h2 className="text-sm font-bold uppercase tracking-tight text-foreground font-mono">
                            Directly Eligible & Ready to Apply ({readyToApply.length})
                          </h2>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          All Documents Ready
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You meet all eligibility criteria and have all required documents available. You can apply on the official government portal immediately.
                      </p>
                      <div className="space-y-4">
                        {readyToApply.map((opp) => (
                          <OpportunityCard key={opp.schemeId} opportunity={opp} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Action Required - Missing Documents */}
                  {actionRequiredDocs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <h2 className="text-sm font-bold uppercase tracking-tight text-foreground font-mono">
                            Eligible — Document Action Required ({actionRequiredDocs.length})
                          </h2>
                        </div>
                        <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                          Procure Document to Avail
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You satisfy all eligibility rules! You only need to obtain or upload the highlighted required document(s) to submit your claim.
                      </p>
                      <div className="space-y-4">
                        {actionRequiredDocs.map((opp) => (
                          <OpportunityCard key={opp.schemeId} opportunity={opp} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Incomplete Profile Info (Only relevant to user) */}
                  {relevantNeedsInfo.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <h2 className="text-sm font-bold uppercase tracking-tight text-foreground font-mono">
                            Complete Profile to Unlock More ({relevantNeedsInfo.length})
                          </h2>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Facts Missing
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Additional details (such as annual income or education stream) are needed to determine your eligibility.
                      </p>
                      <div className="space-y-4">
                        {relevantNeedsInfo.map((opp) => (
                          <OpportunityCard key={opp.schemeId} opportunity={opp} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'schemes' ? (
            /* =========================================================================
               TAB: DISCOVER SCHEMES
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                  All-India Scheme Registry ({filteredSchemes.length} of {schemes.length})
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Browse official Central and State welfare schemes, scholarships, and entitlements across India. Filter by region, state, or demographic tags.
                </p>
              </div>

              {/* Search & State Filter Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={schemeSearchQuery}
                      onChange={(e) => setSchemeSearchQuery(e.target.value)}
                      placeholder="Search schemes across India by name, keyword, tag (e.g. Annapurna, scholarship, widow, farmer)..."
                      className="w-full rounded-[3px] border border-border bg-card pl-9 pr-8 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground"
                    />
                    {schemeSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSchemeSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* State / Region Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={schemeStateFilter}
                      onChange={(e) => setSchemeStateFilter(e.target.value)}
                      className="rounded-[3px] border border-border bg-card pl-3 pr-9 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-foreground uppercase font-bold cursor-pointer"
                      aria-label="Filter by State or Jurisdiction"
                    >
                      <option value="all">ALL REGIONS (CENTRAL + STATES)</option>
                      <option value="central">CENTRAL GOVT (ALL INDIA)</option>
                      <option value="West Bengal">WEST BENGAL</option>
                      <option value="Maharashtra">MAHARASHTRA</option>
                      <option value="Rajasthan">RAJASTHAN (ANNAPURNA)</option>
                      <option value="Karnataka">KARNATAKA</option>
                      <option value="Tamil Nadu">TAMIL NADU</option>
                      <option value="Delhi">DELHI (NCT)</option>
                      <option value="Uttar Pradesh">UTTAR PRADESH</option>
                      <option value="Telangana">TELANGANA</option>
                    </select>
                  </div>
                </div>

                {/* Tag Filter Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'all', label: `All Schemes (${schemes.length})` },
                    ...(userCategoryTags.length > 0
                      ? [
                          {
                            id: 'my_profile',
                            label: `★ My Active Tags (${userCategoryTags.map((t) => '#' + t.toUpperCase()).join(' ')})`,
                          },
                        ]
                      : []),
                    { id: 'food', label: 'Annapurna & Food Security' },
                    { id: 'student', label: 'Students & Scholarships' },
                    { id: 'women', label: 'Women & Widows' },
                    { id: 'pension', label: 'Elderly & Pensions' },
                    { id: 'caste', label: 'SC / ST / OBC' },
                    { id: 'farmer', label: 'Farmers & Agriculture' },
                    { id: 'health', label: 'Healthcare' },
                    { id: 'livelihood', label: 'Employed, MSME & Livelihood' },
                  ].map((chip) => {
                    const isSelected = schemeTagFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setSchemeTagFilter(chip.id)}
                        className={`rounded px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                          isSelected
                            ? 'bg-foreground text-background shadow-sm'
                            : 'bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground border border-border'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredSchemes.length === 0 ? (
                <div className="rounded border border-dashed border-border p-8 text-center text-xs space-y-2">
                  <p className="font-bold text-foreground">No schemes found matching the selected filters</p>
                  <p className="text-muted-foreground">Try clearing your search query or changing state / category filters.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSchemeSearchQuery('');
                      setSchemeTagFilter('all');
                      setSchemeStateFilter('all');
                    }}
                    className="mt-2 text-xs"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSchemes.map((s) => {
                    const sTags: string[] = Array.isArray(s.tags) ? s.tags : [];
                    return (
                      <Card
                        key={s.id}
                        className="flex flex-col justify-between hover:border-foreground transition-colors"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] uppercase text-muted-foreground">
                            <span className="font-black text-foreground">
                              {s.jurisdiction === 'central' ? 'Central Scheme' : s.state ?? 'West Bengal'}
                            </span>
                            <span className="capitalize px-1.5 py-0.5 rounded bg-muted/60 text-foreground font-semibold">
                              {s.category}
                            </span>
                          </div>
                          <CardTitle className="text-base mt-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedSchemeId(s.id)}
                              className="text-left font-bold text-foreground hover:underline"
                            >
                              {s.name}
                            </button>
                          </CardTitle>
                          {s.name_bn && (
                            <p className="font-bengali text-xs text-muted-foreground">{s.name_bn}</p>
                          )}
                          {s.ministry_label && (
                            <CardDescription className="text-[11px] line-clamp-1">{s.ministry_label}</CardDescription>
                          )}

                          {/* Tag Badges */}
                          {sTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {sTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-muted text-foreground uppercase tracking-tight"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {s.short_description}
                          </p>
                          <div className="border-t border-border pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSchemeId(s.id)}
                                className="text-foreground font-bold hover:underline"
                              >
                                Inspect Rules & Steps →
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isEnrollingSchemeId === s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleEnroll(s.id);
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                                  enrolledList.some((e) => e.scheme_id === s.id || e.schemes?.id === s.id)
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20'
                                    : 'bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-foreground/40'
                                }`}
                                title={
                                  enrolledList.some((e) => e.scheme_id === s.id || e.schemes?.id === s.id)
                                    ? 'Currently marked as enrolled/receiving. Click to unmark.'
                                    : 'Mark this scheme as already receiving / enrolled'
                                }
                              >
                                {enrolledList.some((e) => e.scheme_id === s.id || e.schemes?.id === s.id) ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Already Getting</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3" />
                                    <span>Already Getting?</span>
                                  </>
                                )}
                              </button>
                              {s.portal_url && (
                                <a
                                  href={s.portal_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Apply <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'enrolled' ? (
            /* =========================================================================
               TAB: ENROLLED SCHEMES (Already Getting)
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    Enrolled Schemes ({enrolledList.length})
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Schemes that <strong className="text-foreground">{activeCitizen.name}</strong> ({activeCitizen.relationship}) is currently enrolled in and actively receiving benefits from.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => switchTab('schemes')} className="gap-1.5 text-xs font-mono">
                  <Plus className="h-3.5 w-3.5" /> Add Another Scheme
                </Button>
              </div>

              {enrolledList.length === 0 ? (
                <div className="rounded border border-dashed border-border p-8 text-center space-y-3 bg-muted/20">
                  <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold">No Enrolled Schemes Recorded Yet</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    If {activeCitizen.name} is already receiving government benefits (such as PM-KISAN, Annapurna Bhandar, or Old Age Pension), mark them in Discover Schemes by clicking &quot;+ Already Getting?&quot; on any scheme card.
                  </p>
                  <Button size="sm" onClick={() => switchTab('schemes')} className="mt-2 text-xs font-mono">
                    Browse Schemes Directory →
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {enrolledList.map((item: any) => {
                    const s = item.schemes ?? schemes.find((sch) => sch.id === item.scheme_id);
                    if (!s) return null;
                    return (
                      <Card
                        key={item.id || item.scheme_id}
                        className="border-emerald-500/40 bg-card hover:shadow-sm transition-all"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" /> ACTIVE BENEFIT
                            </span>
                            <span className="text-[10px] uppercase font-mono text-muted-foreground">
                              {s.jurisdiction === 'central' ? 'Central' : s.state ?? 'State'}
                            </span>
                          </div>
                          <CardTitle className="text-base mt-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSchemeId(s.id)}
                              className="text-left font-bold text-foreground hover:underline"
                            >
                              {s.name}
                            </button>
                          </CardTitle>
                          {s.name_bn && (
                            <p className="font-bengali text-xs text-muted-foreground">{s.name_bn}</p>
                          )}
                          {s.ministry_label && (
                            <CardDescription className="text-[11px] line-clamp-1">{s.ministry_label}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3 text-xs">
                          {s.short_description && (
                            <p className="text-muted-foreground line-clamp-2">{s.short_description}</p>
                          )}
                          <div className="border-t border-border/80 pt-2.5 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSchemeId(s.id)}
                              className="text-primary font-bold hover:underline text-xs"
                            >
                              Inspect Details →
                            </button>
                            <button
                              type="button"
                              disabled={isEnrollingSchemeId === s.id}
                              onClick={() => handleToggleEnroll(s.id)}
                              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 text-[11px] font-mono hover:underline cursor-pointer"
                              title="Remove from enrolled benefits"
                            >
                              Remove
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'saved' ? (
            /* =========================================================================
               TAB: SAVED SCHEMES
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Saved Schemes
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Schemes bookmarked for your personal application preparations.
                </p>
              </div>

              {savedSchemes.length === 0 ? (
                <div className="rounded border border-border p-8 text-center space-y-2">
                  <Bookmark className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-semibold">No saved schemes</p>
                  <p className="text-xs text-muted-foreground">
                    Bookmark schemes in Discover Schemes to see them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedSchemes.map((item: any) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:border-foreground"
                      onClick={() => setSelectedSchemeId(item.schemes?.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">{item.schemes?.name}</CardTitle>
                        <CardDescription className="text-xs">{item.schemes?.short_description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'applications' ? (
            /* =========================================================================
               TAB: APPLICATIONS & CLAIMS
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Tracked Claims & Tasks
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage your official application preparation checklists, status changes, and reference IDs.
                </p>
              </div>

              {claims.length === 0 ? (
                <div className="rounded border border-border p-8 text-center space-y-3">
                  <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-semibold">No tracked applications</p>
                  <p className="text-xs text-muted-foreground">
                    Click &quot;Track Application&quot; on any eligible opportunity to begin managing its checklist.
                  </p>
                  <Button size="sm" onClick={() => switchTab('opportunities')}>
                    Find Opportunities
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <ClaimCard key={claim.id} claim={claim} />
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'reminders' ? (
            /* =========================================================================
               TAB: REMINDERS
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Deadlines & Reminders
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage application deadlines, institutional submission dates, and Duare Sarkar camp visits.
                </p>
              </div>
              <RemindersView reminders={reminders} />
            </div>
          ) : activeTab === 'assistant' ? (
            /* =========================================================================
               TAB: AI ASSISTANT
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <PraptiLogo className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                    Prapti AI
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Context-aware assistant for <strong className="text-foreground">{activeCitizen.name}</strong> ({activeCitizen.relationship}). Ask why you qualify, why you are not eligible, what documents you need, or update facts in plain English or regional languages.
                  </p>
                </div>
              </div>
              <AssistantChat
                activeCitizen={activeCitizen}
                familyMembers={familyMembers}
                citizenState={citizenState}
                eligibleCount={eligibleCount}
                readyDocsCount={readyDocsCount}
                totalDocsCount={totalDocsCount}
                onSwitchProfile={handleSwitchMember}
              />
            </div>
          ) : activeTab === 'profile_personal' ? (
            /* =========================================================================
               TAB: PROFILE PERSONAL & ADDRESS
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Personal Details, Identity Tags & Address
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Beneficiary: <strong className="text-foreground">{activeCitizen.name}</strong> ({activeCitizen.relationship}).
                  Category tags inform deterministic rule matching across 17+ central and state schemes.
                </p>
              </div>

              {/* Interactive Category & Identity Tags Selector */}
              <CategoryTagsSelector activeCitizen={activeCitizen} />

              <div className="pt-2">
                <PersonalDetailsForm initial={personalDetails} />
              </div>
              <div className="pt-6 border-t border-border">
                <AddressForm kind="current" initial={addresses?.current ?? null} />
              </div>
            </div>
          ) : activeTab === 'profile_education' ? (
            /* =========================================================================
               TAB: PROFILE EDUCATION
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Education Records
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Record your secondary, higher secondary, diploma, and undergraduate marks for merit scholarships.
                </p>
              </div>
              <EducationManager records={educationRecords} />
            </div>
          ) : activeTab === 'profile_finance' || activeTab === 'profile_assets' ? (
            /* =========================================================================
               TAB: PROFILE FINANCE, ASSETS & EMPLOYMENT
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Finance, Assets & Employment
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Active Beneficiary: <strong className="text-foreground">{activeCitizen.name}</strong> ({activeCitizen.relationship}).
                  Record annual income, owned property (2-wheeler, 4-wheeler, houses, land), and SECC welfare criteria.
                </p>
              </div>
              <FinanceForm initial={financialProfile} />
              <div className="pt-6 border-t border-border">
                <AssetForm initial={assetProfile ?? {
                  ownsTwoWheeler: false,
                  twoWheelerCount: null,
                  ownsFourWheeler: false,
                  fourWheelerCount: null,
                  ownsHouse: false,
                  houseCount: null,
                  houseType: null,
                  ownsLand: false,
                  landAreaAcres: null,
                  landType: null,
                  ownsAgriculturalEquipment: false,
                  agriculturalEquipmentDetails: null,
                  hasRefrigerator: false,
                  hasAirConditioner: false,
                  ownsCommercialProperty: false,
                  hasKisanCreditCard: false,
                  kccCreditLimitInr: null,
                }} />
              </div>
              <div className="pt-6 border-t border-border">
                <EmploymentForm initial={employmentProfile} />
              </div>
            </div>
          ) : activeTab === 'profile_agriculture' ? (
            /* =========================================================================
               TAB: PROFILE AGRICULTURE
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Agricultural Profile
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  For farmers, cultivators, and sharecroppers applying for Krishak Bandhu or PM-KISAN.
                </p>
              </div>
              <AgricultureForm initial={agriculturalProfile} />
            </div>
          ) : activeTab === 'profile_documents' ? (
            /* =========================================================================
               TAB: PROFILE DOCUMENTS
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Document Readiness Inventory
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Record certificate possession. Aadhaar numbers or copies are NEVER requested or stored.
                </p>
              </div>
              <DocumentsForm rows={documentRows} />
            </div>
          ) : activeTab === 'guides' ? (
            /* =========================================================================
               TAB: GUIDES
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Official Certificate Guides
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Procedures for obtaining essential West Bengal documents and certificates.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">West Bengal Domicile Certificate</CardTitle>
                    <CardDescription className="text-xs">Required for SVMCM and state quotas.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-muted-foreground">
                    <p>1. Apply online via e-District portal (edistrict.wb.gov.in) or SDO/BDO office.</p>
                    <p>2. Provide residential tax receipt, school certificate, and birth proof.</p>
                    <p>3. Digitally signed certificate issued within 7-15 business days.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">SDO / BDO Income Certificate</CardTitle>
                    <CardDescription className="text-xs">Required for income threshold evaluations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-muted-foreground">
                    <p>1. Obtain local Gram Panchayat Pradhan or Municipality income report.</p>
                    <p>2. Upload to e-District portal with salary slip, IT return, or affidavit.</p>
                    <p>3. Valid for the current financial year across all state schemes.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Aadhaar Bank DBT Linkage</CardTitle>
                    <CardDescription className="text-xs">Crucial for receiving direct cash transfers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-muted-foreground">
                    <p>1. Visit your bank branch with passbook and Aadhaar copy.</p>
                    <p>2. Fill in NPCI mandate form to map your account for DBT.</p>
                    <p>3. Verify status on UIDAI portal under bank-seeding status.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Duare Sarkar Camp Guide</CardTitle>
                    <CardDescription className="text-xs">Statewide outreach camps in West Bengal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-muted-foreground">
                    <p>1. Locate camp schedule at your local Gram Panchayat or Municipality.</p>
                    <p>2. Carry photo, bank passbook copy, Aadhaar availability, and voter card.</p>
                    <p>3. Retain stamped registration receipt with unique serial number.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : activeTab === 'help' ? (
            /* =========================================================================
               TAB: HELP & HELPLINES
            ========================================================================= */
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Helplines & Support
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Official government department telephone helpdesks and FAQs.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  { name: 'Banglar Sahayata Kendra (BSK)', number: '1800-345-0117', type: 'Toll Free' },
                  { name: 'SVMCM Scholarship Helpdesk', number: '1800-102-8014', type: 'Toll Free' },
                  { name: 'Krishak Bandhu Assistance', number: '8336957370 / 8336957371', type: 'Helpline' },
                  { name: 'Kanyashree Support Desk', number: 'support.kanyashree@wb.gov.in', type: 'Email' },
                ].map((h) => (
                  <div key={h.name} className="rounded border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{h.name}</span>
                      <span className="text-[9px] uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {h.type}
                      </span>
                    </div>
                    <p className="font-mono text-primary font-bold">{h.number}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'family_members' || activeTab === 'household' ? (
            /* =========================================================================
               TAB: FAMILY MEMBERS (EASY REGISTRATION & SWITCHING)
            ========================================================================= */
            <FamilyMembersView
              activeCitizen={activeCitizen}
              familyMembers={familyMembers}
            />
          ) : activeTab === 'privacy' ? (
            /* =========================================================================
               TAB: PRIVACY & DATA EXPORT
            ========================================================================= */
            <div className="space-y-6 max-w-3xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Privacy & Data Protection
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Your data is protected by strict PostgreSQL Row Level Security. We never collect Aadhaar numbers.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Export Your Data</CardTitle>
                  <CardDescription className="text-xs">
                    Download a full JSON machine-readable export of all your recorded circumstances and claims.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExportDataButton
                    exportData={{
                      user,
                      citizenId,
                      personalDetails,
                      addresses,
                      financialProfile,
                      employmentProfile,
                      educationRecords,
                      agriculturalProfile,
                      exportedAt: new Date().toISOString(),
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'settings' ? (
            /* =========================================================================
               TAB: SETTINGS
            ========================================================================= */
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Preferences
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage display name and interface language.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Profile Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={updateUserSettings} className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-foreground">Display Name</label>
                      <input
                        type="text"
                        name="fullName"
                        defaultValue={user.full_name ?? ''}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-foreground">Preferred Language</label>
                      <select
                        name="language"
                        defaultValue={user.preferred_language ?? 'en'}
                        className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="en">English</option>
                        <option value="bn">বাংলা (Bengali)</option>
                      </select>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" size="sm">Save Preferences</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
