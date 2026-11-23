import { describe, it, expect } from 'vitest';
import {
  getTranslation,
  resolveServerLocale,
  SUPPORTED_LOCALES,
  TRANSLATIONS,
} from './index';

describe('i18n Localization Engine', () => {
  it('has all 4 supported languages defined (English, Bengali, Hindi, Marathi)', () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toEqual(['en', 'bn', 'hi', 'mr']);
  });

  it('contains valid translation dictionaries for all 4 languages', () => {
    expect(TRANSLATIONS.en.nav.signIn).toBe('Sign In');
    expect(TRANSLATIONS.bn.nav.signIn).toBe('সাইন ইন');
    expect(TRANSLATIONS.hi.nav.signIn).toBe('साइन इन');
    expect(TRANSLATIONS.mr.nav.signIn).toBe('साइन इन');
  });

  it('correctly translates hero section in Bengali, Hindi, and Marathi', () => {
    expect(getTranslation('en', 'hero.title')).toBe('PRAPTI');
    expect(getTranslation('bn', 'hero.badgeNoDocs')).toBe('কোনো নথি সংরক্ষিত হয় না');
    expect(getTranslation('hi', 'hero.badgeNoDocs')).toBe('कोई दस्तावेज संग्रहीत नहीं');
    expect(getTranslation('mr', 'hero.badgeNoDocs')).toBe('कोणतेही दस्तऐवज साठवले जात नाहीत');
  });

  it('correctly translates dashboard navigation labels across languages', () => {
    expect(getTranslation('bn', 'dashboard.overview')).toBe('বিবরণ');
    expect(getTranslation('hi', 'dashboard.overview')).toBe('अवलोकन');
    expect(getTranslation('mr', 'dashboard.overview')).toBe('विहंगावलोकन');
  });

  it('falls back to English if key is missing or invalid', () => {
    expect(getTranslation('bn', 'hero.nonExistentKey')).toBe('hero.nonExistentKey');
  });

  it('resolves server locale from cookie string safely', () => {
    expect(resolveServerLocale('bn')).toBe('bn');
    expect(resolveServerLocale('hi')).toBe('hi');
    expect(resolveServerLocale('mr')).toBe('mr');
    expect(resolveServerLocale('en')).toBe('en');
    expect(resolveServerLocale('invalid_lang')).toBe('en');
    expect(resolveServerLocale(null)).toBe('en');
  });
});
