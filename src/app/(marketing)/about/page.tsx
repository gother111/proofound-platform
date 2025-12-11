import type { Metadata } from 'next';
import { MarketingPage } from '../_components/MarketingPage';

export const metadata: Metadata = {
  title: 'About Proofound',
  description: 'Why Proofound replaces CV noise with proof-backed, values-aware matches.',
};

export default function AboutPage() {
  return (
    <MarketingPage
      title="About Proofound"
      description="Proofound connects organizations with verified expertise while keeping privacy, consent, and fairness at the center."
    >
      <p className="text-base leading-relaxed text-muted-foreground">
        We replace CV keyword noise with proof-backed expertise: skills, outcomes, methods, and
        values/causes. The goal is faster, values-aligned introductions that reduce bias and shorten
        time-to-first qualified intro and time-to-value.
      </p>
      <p className="text-base leading-relaxed text-muted-foreground">
        Privacy and consent are default. There is no social feed or engagement vanity—just
        transparent guardrails, fairness checks, and user-controlled visibility so both individuals
        and organizations can act with confidence.
      </p>
    </MarketingPage>
  );
}
