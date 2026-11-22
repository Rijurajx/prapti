import type { Metadata } from 'next';
import { Inter, Noto_Sans_Bengali, Space_Mono, Silkscreen } from 'next/font/google';
import './globals.css';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceMono.variable} ${silkscreen.variable} ${notoBengali.variable} bg-background text-foreground antialiased font-mono selection:bg-black selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
