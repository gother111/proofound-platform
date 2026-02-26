import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

export const metadata: Metadata = buildPublicMetadata({
  title: 'Contact Proofound | Support, security, partnerships',
  description:
    'Contact the Proofound team for platform support, security disclosures, partnership inquiries, and operational questions with clear response expectations.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <MarketingPage
      title="Contact Proofound"
      description="Need help or have a question? Here is how to reach us safely."
      ctaLabel="Go to homepage"
      ctaHref="/"
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        For support, security questions, or partnership inquiries, email us and we will respond as
        soon as possible.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        For account and product support, include the page URL, browser version, and a short
        description of what happened. For security reports, include reproduction details and any
        relevant logs or screenshots. Responsible disclosure reports are triaged quickly and handled
        confidentially.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        If your request is policy-related, include the policy page and section reference so we can
        route it to the right owner. We aim to provide practical, actionable responses and follow-up
        timelines for unresolved issues.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        For procurement, enterprise onboarding, or integration planning, include your timeline and
        constraints so we can prepare relevant technical and policy details before the first call.
        Our goal is to make support interactions efficient, concrete, and easy to act on.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        For follow-up requests, include the previous email thread reference so context is preserved.
        This helps us avoid duplicate triage and improves turnaround for complex cross-team issues
        that involve product, operations, and policy owners.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        If you prefer asynchronous updates, mention that in your first message and we will provide a
        status cadence with clear owners and checkpoints. We keep responses action-oriented, with
        explicit next steps and expected timelines whenever additional investigation is needed.
      </p>
      <Link
        className="text-sm font-semibold text-proofound-forest underline underline-offset-4"
        href="mailto:hello@proofound.io"
      >
        hello@proofound.io
      </Link>
    </MarketingPage>
  );
}
