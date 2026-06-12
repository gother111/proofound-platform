import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, CheckCircle2, Cookie, RotateCcw, ShieldCheck } from 'lucide-react';
import { CookieSettingsClient } from '@/components/cookies/CookieSettingsClient';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
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
  const returnTo = sanitizeReturnPath(returnToParam, '/');
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/cookies/settings',
    title: 'Cookie Settings | Manage Proofound consent preferences',
    description:
      'Manage cookie consent preferences for Proofound, including essential and optional categories, with clear controls and privacy-safe defaults.',
  });

  return (
    <div className="min-h-screen bg-japandi-bg">
      <JsonLdScripts items={jsonLdItems} idPrefix="cookie-settings-jsonld" />
      <header className="border-b border-proofound-stone bg-white/90">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <Link
              href={returnTo}
              aria-label="Return to previous page"
              className="inline-flex min-h-10 min-w-0 items-center gap-2 justify-self-start rounded-md pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="truncate">Return to previous page</span>
            </Link>
            <Link
              href="/"
              className="font-serif text-2xl font-bold text-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
            >
              Proofound
            </Link>
            <div aria-hidden="true" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-proofound-forest/10">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 font-display text-4xl font-semibold text-proofound-forest">
            Cookie Settings
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-7 text-muted-foreground">
            Choose which optional cookies Proofound may use in this browser. Essential cookies stay
            on so security, consent, and account routes keep working.
          </p>
        </div>

        <section
          aria-labelledby="cookie-privacy-defaults"
          className="mb-8 rounded-2xl border border-proofound-stone bg-white/85 p-4 shadow-[0_4px_24px_rgba(29,51,48,0.06)] sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-proofound-forest/10">
                <ShieldCheck className="h-5 w-5 text-proofound-forest" />
              </span>
              <div className="min-w-0">
                <h2
                  id="cookie-privacy-defaults"
                  className="font-display text-xl font-semibold text-proofound-charcoal"
                >
                  Privacy-safe defaults
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Optional analytics and marketing cookies stay off until you choose them. Saved
                  choices apply to this browser and can be changed here any time.
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D7E8DE] bg-[#F3FAF6] px-3 py-1.5 text-xs font-medium text-proofound-forest">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Essential only by default
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/60 bg-proofound-parchment/45 p-3">
              <p className="text-sm font-semibold text-proofound-charcoal">Essential stays on</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Needed for security, session, and consent routing.
              </p>
            </div>
            <div className="rounded-xl border border-white/60 bg-proofound-parchment/45 p-3">
              <p className="text-sm font-semibold text-proofound-charcoal">Optional starts off</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Analytics and marketing only run after explicit consent.
              </p>
            </div>
            <div className="rounded-xl border border-white/60 bg-proofound-parchment/45 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-proofound-charcoal">
                <RotateCcw className="h-3.5 w-3.5 text-proofound-forest" />
                Reversible
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Change or withdraw prior choices from this page.
              </p>
            </div>
          </div>
        </section>

        <CookieSettingsClient returnTo={returnTo} />

        <div className="mt-12 space-y-4 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold text-proofound-forest">Learn More</h2>

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
              className="rounded-lg border p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <h3 className="font-semibold mb-1">Privacy Policy</h3>
              <p className="text-sm text-muted-foreground">
                Read our complete privacy policy to understand how we protect your data.
              </p>
            </Link>

            <Link
              href="/cookies"
              className="rounded-lg border p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <h3 className="font-semibold mb-1">Cookie Policy</h3>
              <p className="text-sm text-muted-foreground">
                Detailed information about the cookies we use and why.
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions about cookies or privacy?{' '}
            <a href="mailto:privacy@proofound.io" className="text-primary hover:underline">
              Email our privacy team
            </a>
          </p>
        </div>
      </main>

      <footer className="mt-16 border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Proofound. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
