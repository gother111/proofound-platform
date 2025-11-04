import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Root Layout Component
 *
 * Design: Sets up the foundational HTML structure with proper semantic markup
 * Accessibility:
 * - Includes lang attribute for screen readers
 * - Skip-to-content link for keyboard navigation (hidden visually, visible on focus)
 * - Proper document structure with semantic HTML
 * Responsive: Base font size and responsive typography system
 */

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
      <body className="font-sans antialiased">
        {/* Skip to main content link for keyboard users - hidden until focused */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-proofound-forest focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-proofound-forest focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                // Accessible toast styling with proper contrast
                style: {
                  background: 'white',
                  color: '#2D3330',
                  border: '1px solid #E8E6DD',
                },
              }}
            />
            <Analytics />
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
