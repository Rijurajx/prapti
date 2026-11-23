import en from '../../../public/locales/en/common.json';
import bn from '../../../public/locales/bn/common.json';
import hi from '../../../public/locales/hi/common.json';
import mr from '../../../public/locales/mr/common.json';

export type SupportedLocale = 'en' | 'bn' | 'hi' | 'mr';

export interface LocaleInfo {
  code: SupportedLocale;
  label: string;
  native: string;
  badge: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', label: 'English', native: 'English', badge: 'EN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', badge: 'BN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', badge: 'HI' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', badge: 'MR' },
];

export const LOCALE_COOKIE_NAME = 'prapti_locale';
export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const TRANSLATIONS: Record<SupportedLocale, typeof en> = {
  en,
  bn: bn as typeof en,
  hi: hi as typeof en,
  mr: mr as typeof en,
};

/**
 * Resolves a translation string by nested dot-path (e.g. "hero.title", "nav.signIn").
 * Falls back to English if the key is missing in the chosen language.
 */
export function getTranslation(locale: SupportedLocale, path: string): string {
  const dictionary = TRANSLATIONS[locale] ?? TRANSLATIONS[DEFAULT_LOCALE];
  const keys = path.split('.');

  let current: any = dictionary;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      let fallbackCurrent: any = TRANSLATIONS[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && fk in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fk];
        } else {
          return path;
        }
      }
      return typeof fallbackCurrent === 'string' ? fallbackCurrent : path;
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Server-side helper to read the active locale from cookies.
 */
export function resolveServerLocale(cookieValue?: string | null): SupportedLocale {
  if (!cookieValue) return DEFAULT_LOCALE;
  const val = cookieValue.toLowerCase().trim() as SupportedLocale;
  if (['en', 'bn', 'hi', 'mr'].includes(val)) {
    return val;
  }
  return DEFAULT_LOCALE;
}
