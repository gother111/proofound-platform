import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Cookie } from 'lucide-react';
import { CookieSettingsClient } from '@/components/cookies/CookieSettingsClient';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

/**
 * Cookie Settings Page
 *
 * Allows users to manage granular cookie preferences
 * Accessible from cookie banner's "Cookie Settings" link
 * GDPR-compliant with clear category descriptions
 *
 * Supports returnTo parameter to redirect back after saving
 */

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Cookie Settings | Manage Proofound consent preferences',
  description:
    'Manage cookie consent preferences for Proofound, including essential and optional categories, with clear controls and privacy-safe defaults.',
  path: '/cookies/settings',
});

export default async function CookieSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo: returnToParam } = await searchParams;
  const returnTo = returnToParam || '/';
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/cookies/settings',
    title: 'Cookie Settings | Manage Proofound consent preferences',
    description:
      'Manage cookie consent preferences for Proofound, including essential and optional categories, with clear controls and privacy-safe defaults.',
  });

  return (
    <div className="min-h-screen bg-japandi-bg">
      <JsonLdScripts items={jsonLdItems} idPrefix="cookie-settings-jsonld" />
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={returnTo}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to previous page
            </Link>
            {/* Logo */}
            <Link href="/" className="font-serif text-2xl font-bold text-proofound-forest">
              Proofound
            </Link>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Page Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-proofound-forest mb-3">Cookie Settings</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your cookie preferences to control how we collect and use your data. Your choices
            help us respect your privacy while improving your experience.
          </p>
        </div>

        {/* GDPR Notice */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Your Privacy Matters:</strong> We are committed to protecting your data under
            GDPR regulations. You can change these settings at any time. Essential cookies are
            required for the site to function and cannot be disabled.
          </p>
        </div>

        {/* Cookie Preferences Component with client-side routing */}
        <CookieSettingsClient returnTo={returnTo} />

        {/* Additional Information */}
        <div className="mt-12 pt-8 border-t space-y-4">
          <h2 className="text-xl font-semibold text-proofound-forest mb-4">Learn More</h2>

          <p className="text-sm leading-6 text-muted-foreground">
            Essential cookies keep authentication, security protections, and core routing stable.
            Optional categories are off by default and only enabled after explicit consent. Changes
            are saved immediately, and you can revisit this page any time to review or withdraw
            prior choices.
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            We periodically review cookie usage to keep processing limited to justified purposes. If
            we introduce materially different optional tracking behavior, we will update policy
            versions and request renewed consent where required.
          </p>

          <p className="text-sm leading-6 text-muted-foreground">
            Your settings apply to this browser session context and can be revisited whenever your
            preferences change. If cookies are cleared by browser tools, consent choices may reset
            and you can reconfigure them from this page. We aim to keep controls understandable so
            consent decisions remain practical, reversible, and transparent.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/privacy"
              className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <h3 className="font-semibold mb-1">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Read our complete privacy policy to understand how we protect your data.
              </p>
            </Link>

            <Link
              href="/cookies"
              className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <h3 className="font-semibold mb-1">Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                Detailed information about the cookies we use and why.
              </p>
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions about cookies or privacy?{' '}
            <Link href="/support" className="text-primary hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Proofound. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
