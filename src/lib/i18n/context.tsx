'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  getTranslation,
} from './index';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  t: (key: string) => string;
  locales: typeof SUPPORTED_LOCALES;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
  locales: SUPPORTED_LOCALES,
});

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);

  // Sync from localStorage on initial mount if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_COOKIE_NAME) as SupportedLocale;
      if (stored && ['en', 'bn', 'hi', 'mr'].includes(stored) && stored !== locale) {
        setLocaleState(stored);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [locale]);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_COOKIE_NAME, next);
      document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent('prapti-locale-change', { detail: next }));
    } catch {
      // Ignore
    }
  }, []);

  // Listen to cross-component or cross-tab locale changes
  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLocale>;
      if (customEvent.detail && customEvent.detail !== locale) {
        setLocaleState(customEvent.detail);
      }
    };

    window.addEventListener('prapti-locale-change', handleLocaleChange);
    return () => window.removeEventListener('prapti-locale-change', handleLocaleChange);
  }, [locale]);

  const t = useCallback(
    (key: string) => getTranslation(locale, key),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: SUPPORTED_LOCALES }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
