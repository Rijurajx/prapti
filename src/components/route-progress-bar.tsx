'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Triggered when pathname or searchParams finish updating
  useEffect(() => {
    if (loading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, loading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading && progress < 85) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(interval);
            return prev;
          }
          const increment = Math.max(1, (85 - prev) * 0.15);
          return Math.min(85, prev + increment);
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [loading, progress]);

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setProgress(25);
    };

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore hash links, external links, mailto, tel, downloads, or target="_blank"
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.target === '_blank' ||
        target.hasAttribute('download')
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;
        // If clicking link to the current exact path & query, skip
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }

        handleStart();
      } catch {
        // invalid URL, ignore
      }
    };

    window.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('prapti:nav-start', handleStart);

    return () => {
      window.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('prapti:nav-start', handleStart);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-foreground shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.7)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

/** Helper to trigger top loader programmatically on form submits or pushState */
export function triggerPageLoading() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('prapti:nav-start'));
  }
}
