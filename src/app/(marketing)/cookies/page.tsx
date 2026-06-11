import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { POLICY_EFFECTIVE_DATES, POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Cookie Policy | How Proofound handles cookie consent',
  description:
    'Understand how Proofound uses essential and optional cookies, how consent works, and how to change preferences at any time from cookie settings.',
  path: '/cookies',
});

export default function CookiesPage() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/cookies',
    title: 'Cookie Policy | How Proofound handles cookie consent',
    description:
      'Understand how Proofound uses essential and optional cookies, how consent works, and how to change preferences at any time from cookie settings.',
  });

  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="cookies-jsonld" />
      <MarketingPage
        title="Cookie Policy"
        description="Proofound uses strictly necessary cookies by default and optional analytics cookies only with your consent."
        ctaLabel="Manage cookies"
        ctaHref="/cookies/settings"
      >
        <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Effective date: {POLICY_EFFECTIVE_DATES.cookie} · Version: {POLICY_VERSIONS.cookie}
          </p>
          <p>
            Necessary cookies support authentication, security, and core account functionality.
            These cannot be switched off.
          </p>
          <p>
            Analytics cookies are optional. We only activate non-essential telemetry after explicit
            consent. You can withdraw or change your preferences at any time.
          </p>
          <p>We do not use third-party advertising cookies and we do not sell personal data.</p>
          <p>
            Cookie retention and purpose are reviewed regularly to keep processing proportional to
            service needs. We avoid broad tracking scopes and only keep technical identifiers for as
            long as necessary to deliver requested functionality, maintain security, or support
            consented analytics.
          </p>
          <p>
            If policy terms change, we update the effective date and version shown above, and we may
            prompt you to re-confirm preferences where required by law. For full processing details,
            review our Privacy Policy and Terms of Service alongside this cookie guidance.
          </p>
          <p>
            When you revisit this page, your latest consent state is reflected in controls so you
            can confirm or revise decisions without guesswork. We design cookie controls to be
            readable, reversible, and aligned with practical user expectations for transparency.
          </p>
          <p>
            Where possible, we prefer privacy-preserving defaults and avoid category sprawl. This
            policy exists to make implementation choices legible, so users understand what each
            cookie category does and how it impacts experience, measurement, and account safety.
          </p>
        </div>
        <Link
          href="/cookies/settings"
          className="inline-flex min-h-10 items-center rounded-md px-2 text-sm font-semibold text-proofound-forest underline underline-offset-4 transition-colors hover:bg-proofound-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
        >
          Open cookie settings
        </Link>
      </MarketingPage>
    </>
  );
}
