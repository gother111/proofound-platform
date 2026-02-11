import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  metadataBase: (() => {
    const candidate =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://proofound.io';
    try {
      return new URL(candidate);
    } catch {
      return new URL('https://proofound.io');
    }
  })(),
  title: 'Proofound - Focus on what matters',
  description: 'A credibility and connection platform built for authenticity, not algorithms.',
  alternates: {
    canonical: '/',
  },
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
        <NextIntlClientProvider messages={messages}>
          {/* Focus target for the skip link. Avoid wrapping in <main> to prevent nested main landmarks. */}
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
