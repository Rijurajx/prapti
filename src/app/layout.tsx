import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Inter, Noto_Sans_Bengali, Space_Mono, Silkscreen } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { RouteProgressBar } from '@/components/route-progress-bar';
import { resolveServerLocale, LOCALE_COOKIE_NAME } from '@/lib/i18n';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pixel',
  display: 'swap',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PRAPTI — Citizen Benefits AI Agent & Discovery Engine',
  description:
    'An intelligent, privacy-first citizen benefits companion for West Bengal and India. Profile-driven scheme matching with zero identity number collection.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const initialLocale = resolveServerLocale(localeCookie);

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('prapti-theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceMono.variable} ${silkscreen.variable} ${notoBengali.variable} bg-background text-foreground antialiased font-mono selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black`}
      >
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        <I18nProvider initialLocale={initialLocale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
