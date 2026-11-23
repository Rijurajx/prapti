'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { SupportedLocale } from '@/lib/i18n';

export function LanguageSwitcher({
  className = '',
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, locales } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLocaleInfo = locales.find((l) => l.code === locale) ?? locales[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLocale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left font-mono ${isOpen ? 'z-[9999]' : 'z-30'} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-[3px] border border-border bg-card px-2 py-1 sm:px-2.5 sm:py-1 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
        aria-label="Select website language"
        title="Switch language (English / বাংলা / हिन्दी / मराठी)"
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex items-center gap-1">
          {!compact && (
            <span className="text-muted-foreground font-mono text-[10px] hidden sm:inline">LANG:</span>
          )}
          <span className="font-bold text-[11px] sm:text-xs">{activeLocaleInfo?.badge}</span>
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-md border border-border bg-popover p-1 shadow-2xl z-[9999] text-xs">
          <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border mb-1">
            Language / ভাষা / भाषा
          </div>
          {locales.map((l) => {
            const isSelected = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-foreground text-background font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[11px] opacity-75">{l.badge}</span>
                  <span className="text-xs">{l.native}</span>
                </div>
                {isSelected && <Check className="h-3 w-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
