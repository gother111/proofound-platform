import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';

export const metadata: Metadata = {
  title: 'Careers at Proofound',
  description: 'Join us building trusted, privacy-first expertise infrastructure.',
};

export default function CareersPage() {
  return (
    <MarketingPage
      title="Careers at Proofound"
      description="We are a distributed team focused on security, fairness, and consent-first experiences."
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        We build trusted expertise infrastructure: proof-backed profiles, values-aware matching, and
        bias-aware guardrails. If you care about privacy-first, ethical matching, and measurable
        outcomes like faster time-to-first qualified intro, we would love to hear from you.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Roles open periodically across engineering, data, product, security, and customer
        experience. Tell us your background and why trustworthy expertise matters to you.
      </p>
    </MarketingPage>
  );
}
