'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);

    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('prapti-theme', 'dark');
        document.cookie = 'prapti-theme=dark; path=/; max-age=31536000';
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('prapti-theme', 'light');
        document.cookie = 'prapti-theme=light; path=/; max-age=31536000';
      } catch {}
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className={`h-8 w-8 rounded-[3px] border border-border bg-card flex items-center justify-center text-muted-foreground ${className}`}
      >
        <span className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`h-8 w-8 rounded-[3px] border border-border bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors ${className}`}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-amber-400" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-foreground" />
      )}
    </button>
  );
}
