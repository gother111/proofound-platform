import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';

export const metadata: Metadata = {
  title: 'Contact Proofound',
  description: 'How to reach the Proofound team for support, security, or partnerships.',
};

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
      <Link
        className="text-sm font-semibold text-proofound-forest underline underline-offset-4"
        href="mailto:hello@proofound.io"
      >
        hello@proofound.io
      </Link>
    </MarketingPage>
  );
}
