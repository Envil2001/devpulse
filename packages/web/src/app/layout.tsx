import './globals.css';

import type { Metadata } from 'next';
import { Inter, Martian_Mono } from 'next/font/google';
import { type JSX } from 'react/jsx-runtime';

import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const martianMono = Martian_Mono({
  subsets: ['latin'],
  variable: '--font-martian',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevPulse | Workflow Analytics',
  description: 'Time-tracking and workflow analytics for developers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className={`dark ${inter.variable} ${martianMono.variable}`}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
