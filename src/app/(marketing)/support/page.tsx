import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPage } from '../_components/MarketingPage';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Support | Help with Proofound account and policies',
  description:
    'Get support for your Proofound account, report technical issues, and find the right contact path for security, privacy, and partnership questions.',
  path: '/support',
});

export default function SupportPage() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/support',
    title: 'Support | Help with Proofound account and policies',
    description:
      'Get support for your Proofound account, report technical issues, and find the right contact path for security, privacy, and partnership questions.',
  });

  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="support-jsonld" />
      <MarketingPage
        title="Support"
        description="Use this page to route product, policy, and security questions to the right team without delay."
        ctaLabel="Open contact page"
        ctaHref="/contact"
      >
        <p className="text-base leading-relaxed text-muted-foreground">
          For account issues, include your approximate sign-in time, the page URL, and what you
          expected to happen. This helps us reproduce issues quickly and reduce back-and-forth. For
          accessibility feedback, include assistive technology details so we can test with matching
          conditions.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Security concerns are handled with priority. If you discovered a potential vulnerability,
          send clear reproduction steps, impact summary, and whether the issue is currently
          exploitable. We treat responsible disclosures confidentially and coordinate remediation
          updates once triage is complete.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          Policy and privacy requests should cite the relevant policy section to speed review. If
          you are requesting account deletion, export, or consent changes, include the account email
          and preferred response channel. We aim for transparent status updates until the request is
          resolved.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">
          If you are reporting reproducible defects, include screen recordings or request traces
          where possible. Concrete artifacts reduce triage latency and improve fix accuracy. We
          prioritize issues by user impact, security exposure, and operational risk, and we share
          updates until closure.
        </p>
        <ul className="list-disc space-y-2 pl-6 text-base leading-relaxed text-muted-foreground">
          <li>
            General support and product questions:{' '}
            <Link href="mailto:hello@proofound.io" className="font-semibold text-proofound-forest">
              hello@proofound.io
            </Link>
          </li>
          <li>
            Privacy and data-rights requests:{' '}
            <Link
              href="mailto:privacy@proofound.com"
              className="font-semibold text-proofound-forest"
            >
              privacy@proofound.com
            </Link>
          </li>
          <li>
            Legal and compliance questions:{' '}
            <Link href="mailto:legal@proofound.com" className="font-semibold text-proofound-forest">
              legal@proofound.com
            </Link>
          </li>
        </ul>
      </MarketingPage>
    </>
  );
}
