import type { Metadata } from 'next';
import { connection } from 'next/server';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as LegacyToaster } from '@/components/ui/toaster';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CookieBanner } from '@/components/CookieBanner';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { OptionalTelemetry } from '@/components/OptionalTelemetry';
import { SkipToContentLink } from '@/components/a11y/SkipToContentLink';
import { TransitionProvider } from '@/components/ui/transition-provider';
import { DeferredAppEnhancements } from '@/components/root/DeferredAppEnhancements';

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
  description:
    'A proof-first hiring corridor centered on Proof Packs, privacy-safe review, and clear assignment-based hiring.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/logo.png',
  },
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
  // Nonce-based CSP needs request-time rendering so Next can apply the nonce to framework scripts.
  await connection();

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
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased">
        <SkipToContentLink />
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <GlobalErrorHandler />

            {/* Focus target for the skip link. Avoid wrapping in <main> to prevent nested main landmarks. */}
            <div id="main-content" tabIndex={-1}>
              <TransitionProvider>{children}</TransitionProvider>
            </div>
            <Toaster />
            <LegacyToaster />
            <DeferredAppEnhancements />
            <CookieBanner />
            <OptionalTelemetry />
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
