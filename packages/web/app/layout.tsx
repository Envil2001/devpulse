import type { Metadata } from 'next';
import { Inter, Martian_Mono } from 'next/font/google';
import './globals.css';
import { AuthContextProvider } from '@/contexts/auth-context';
import { AppQueryProvider } from '@/contexts/query-provider';

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
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${martianMono.variable}`}>
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        <AppQueryProvider>
          <AuthContextProvider>{children}</AuthContextProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
