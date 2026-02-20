import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatWidget } from '@/components/support/ChatWidget';
import { CookieBanner } from '@/components/CookieBanner';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { OptionalTelemetry } from '@/components/OptionalTelemetry';
import { SUSPromptHost } from '@/components/surveys/SUSPromptHost';
import { SkipToContentLink } from '@/components/a11y/SkipToContentLink';

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
  metadataBase: (() => {
    const fallbackUrl = 'https://proofound.io';
    const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || fallbackUrl;

    try {
      return new URL(rawUrl);
    } catch {
      return new URL(fallbackUrl);
    }
  })(),
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
        <SkipToContentLink />
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <GlobalErrorHandler />
            <SUSPromptHost />
            {/* Focus target for the skip link. Avoid wrapping in <main> to prevent nested main landmarks. */}
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <Toaster />
            <ChatWidget />
            <CookieBanner />
            <OptionalTelemetry />
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
