import type { Metadata } from 'next';
import { Inter, Crimson_Pro } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const crimsonPro = Crimson_Pro({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Proofound - Focus on what matters',
  description: 'A credibility and connection platform built for authenticity, not algorithms.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, crimsonPro.variable, 'font-sans antialiased')}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-right" />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
