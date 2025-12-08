import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatWidget } from '@/components/support/ChatWidget';
import { CookieBanner } from '@/components/CookieBanner';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import { PerformanceTracker } from '@/components/PerformanceTracker';
import { SUSPromptHost } from '@/components/surveys/SUSPromptHost';

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
  // Safely load messages with fallback to prevent crashes
  let messages = {};
  try {
    messages = await getMessages();
  } catch (error) {
    console.error('Failed to load i18n messages:', error);
    // Fallback to empty messages object to prevent page crash
    // The app will still work, just without translations
  }

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
            <GlobalErrorHandler />
            <SUSPromptHost />
            {children}
            <Toaster />
            <ChatWidget />
            <CookieBanner />
            <PerformanceTracker />
            <WebVitalsReporter />
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
