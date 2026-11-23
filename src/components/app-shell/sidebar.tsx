'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderLock,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface AppNavSection {
  label: string;
  items: AppNavItem[];
}

export const appNavSections: readonly AppNavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
      { href: '/opportunities', label: 'My Opportunities', icon: Sparkles },
    ],
  },
  {
    label: 'My Benefits',
    items: [
      { href: '/schemes', label: 'Discover Schemes', icon: FileText },
      { href: '/dashboard?tab=enrolled', label: 'Enrolled Schemes', icon: CheckCircle2 },
      { href: '/saved', label: 'Saved Schemes', icon: Bookmark },
      { href: '/applications', label: 'My Applications', icon: FileText },
      { href: '/reminders', label: 'Reminders', icon: Bell },
    ],
  },
  {
    label: 'My Information',
    items: [
      { href: '/profile/personal', label: 'Personal Profile', icon: UserRound },
      { href: '/profile/address', label: 'Address', icon: UserRound },
      { href: '/profile/finance', label: 'Finance', icon: FileText },
      { href: '/profile/employment', label: 'Employment', icon: Briefcase },
      { href: '/profile/education', label: 'Education', icon: GraduationCap },
      { href: '/profile/agriculture', label: 'Agriculture', icon: Sprout },
      { href: '/profile/documents', label: 'My Documents', icon: FolderLock },
      { href: '/household', label: 'Household', icon: Users },
    ],
  },
  {
    label: 'Assistance',
    items: [
      { href: '/assistant', label: 'Prapti AI', icon: MessageSquare },
      { href: '/guides', label: 'Application Guides', icon: BookOpen },
      { href: '/help', label: 'Help & Support', icon: LifeBuoy },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/app/privacy', label: 'Privacy & Permissions', icon: ShieldCheck },
    ],
  },
];

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border bg-card transition-[width] duration-200 motion-reduce:transition-none',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-3',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {collapsed ? (
          <span className="text-lg font-semibold text-foreground">P</span>
        ) : (
          <span className="text-lg font-semibold tracking-tight text-foreground">PRAPTI</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {collapsed ? (
            <ChevronsRight aria-hidden="true" className="h-5 w-5" />
          ) : (
            <ChevronsLeft aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-3">
        {appNavSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p
              className={cn(
                'px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground',
                collapsed && 'sr-only',
              )}
            >
              {section.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-10 items-center gap-3 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        collapsed && 'justify-center',
                        active
                          ? 'bg-muted text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
